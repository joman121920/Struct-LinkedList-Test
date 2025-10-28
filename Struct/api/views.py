from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.db.models import Max, F, Avg
from django.utils import timezone

from .serializers import UserRegistrationSerializer, UserProfileSerializer, ClassSerializer, ClassCreateSerializer, UserHeartSerializer, GalistLeaderboardCreateSerializer, GalistLeaderboardSerializer
from .models import Class, User, GalistLeaderboard
from .serializers import ClassSerializer, ClassCreateSerializer

from django.core.files.storage import default_storage
from django.db import transaction


from datetime import timedelta



class UserRegistrationView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                "success": True,
                "message": "User created successfully",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "user_type": user.user_type
                }
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({'error': 'Please provide both email and password'},
                            status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=email, email=email, password=password)

        if not user:
            return Response({'error': 'Invalid credentials'},
                            status=status.HTTP_401_UNAUTHORIZED)

        token, created = Token.objects.get_or_create(user=user)

        # Include profile photo URL if available
        profile_photo_url = None
        if user.profile_photo:
            profile_photo_url = request.build_absolute_uri(user.profile_photo.url)

        return Response({
            'token': token.key,
            'user_id': user.id,
            'email': user.email,
            'username': user.username,
            'user_type': user.user_type,
            'profile_photo_url': profile_photo_url,
            'points': user.points,
            'hearts': user.hearts,
            'hints': user.hints
        }, status=status.HTTP_200_OK)

class ClassCreateView(generics.CreateAPIView):
    serializer_class = ClassCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user)

class JoinClassView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        code = request.data.get('code')

        if not code:
            return Response({"error": "Class code is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            class_obj = Class.objects.get(code=code)

            # If user is already enrolled or is the teacher
            if request.user in class_obj.students.all() or class_obj.teacher == request.user:
                return Response({
                    "success": True,
                    "message": "You are already enrolled in this class",
                    "class": ClassSerializer(class_obj).data
                })

            # Add user to the class
            class_obj.students.add(request.user)

            return Response({
                "success": True,
                "message": "Successfully joined the class",
                "class": ClassSerializer(class_obj).data
            })

        except Class.DoesNotExist:
            return Response({"error": "Invalid class code"}, status=status.HTTP_404_NOT_FOUND)

class UserClassesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        user_classes = {}

        # Get classes where user is a student
        enrolled_classes = user.enrolled_classes.all()

        # Get classes where user is a teacher
        teaching_classes = user.teaching_classes.all()

        return Response({
            "enrolled_classes": ClassSerializer(enrolled_classes, many=True).data,
            "teaching_classes": ClassSerializer(teaching_classes, many=True).data,
            "user_type": user.user_type  # Assuming user_type is available
        })

class DeleteClassView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        try:
            class_obj = Class.objects.get(pk=pk)

            # Only the teacher can delete the class
            if request.user != class_obj.teacher:
                return Response({"error": "You do not have permission to delete this class"},
                               status=status.HTTP_403_FORBIDDEN)

            class_obj.delete()
            return Response({"success": True, "message": "Class deleted successfully"})

        except Class.DoesNotExist:
            return Response({"error": "Class not found"}, status=status.HTTP_404_NOT_FOUND)

class LeaveClassView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            class_obj = Class.objects.get(pk=pk)

            # Check if user is enrolled in the class
            if request.user not in class_obj.students.all():
                return Response({"error": "You are not enrolled in this class"},
                               status=status.HTTP_400_BAD_REQUEST)

            # Remove student from class
            class_obj.students.remove(request.user)

            return Response({
                "success": True,
                "message": "Successfully left the class"
            })

        except Class.DoesNotExist:
            return Response({"error": "Class not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_profile_photo(request):
    """API endpoint to update user profile photo"""
    if 'photo' not in request.FILES:
        return Response({'error': 'No photo provided'}, status=status.HTTP_400_BAD_REQUEST)

    user = request.user

    # Delete old profile photo if it exists
    if user.profile_photo and hasattr(user.profile_photo, 'path') and default_storage.exists(user.profile_photo.path):
        default_storage.delete(user.profile_photo.path)

    # Save new photo
    user.profile_photo = request.FILES['photo']
    user.save()

    # Return the URL of the uploaded photo
    profile_photo_url = None
    if user.profile_photo:
        profile_photo_url = request.build_absolute_uri(user.profile_photo.url)

    return Response({
        'success': True,
        'message': 'Profile photo updated successfully',
        'profile_photo_url': profile_photo_url
    }, status=status.HTTP_200_OK)

class UserProfileView(APIView):
    """API endpoint to get user profile data"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Regenerate hearts before returning profile data
        request.user.regenerate_hearts()
        
        serializer = UserProfileSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        """Update user profile data"""
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserHeartsView(APIView):
    """API endpoint to get and manage user heart data"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        now = timezone.now()
        
        # Update last_heart_regen_time in TWO situations:
        # 1. If hearts are full, update regen time to now to prevent instant regeneration later
        # 2. If hearts_gained_today is manually reset to 0
        
        if user.hearts >= user.max_hearts:
            # If hearts are full, always set last_heart_regen_time to now
            # This prevents instant regeneration when hearts go below max
            user.last_heart_regen_time = now
            user.save(update_fields=['last_heart_regen_time'])
        elif user.hearts_gained_today == 0 and user.hearts < user.max_hearts:
            # Handle manual database reset of hearts_gained_today
            # Check if last_heart_regen_time is too old (would allow instant regeneration)
            time_diff = (now - user.last_heart_regen_time).total_seconds() / 60
            if time_diff >= 30:  # If it would regenerate at least 1 heart
                # Update last_heart_regen_time to now - forces waiting 30 mins for next heart
                user.last_heart_regen_time = now
                user.save(update_fields=['last_heart_regen_time'])

        # Check and regenerate hearts based on time elapsed
        user.regenerate_hearts()
        
        serializer = UserHeartSerializer(user, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        """Endpoint to use a heart (decrement count)"""
        user = request.user
        try:
            hearts_to_use = int(request.data.get('hearts_to_use', 1))
        except (TypeError, ValueError):
            return Response({"error": "Invalid hearts_to_use value"}, status=status.HTTP_400_BAD_REQUEST)

        if hearts_to_use <= 0:
            return Response({"error": "hearts_to_use must be positive"}, status=status.HTTP_400_BAD_REQUEST)

        if user.hearts < hearts_to_use:
            return Response(
                {"error": "Not enough hearts available", "hearts": user.hearts},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.hearts -= hearts_to_use
        user.save(update_fields=['hearts'])
        
        serializer = UserHeartSerializer(user, context={'request': request})
        return Response(serializer.data)
    
class PointsUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        points_to_add = request.data.get('score', 0)  # Changed 'points' to 'score' to match frontend
        quiz_type = request.data.get('quiz_type', 'unknown')
        user = request.user
        
        # Use atomic transaction to ensure both updates happen together
        with transaction.atomic():
            # Update points and quiz attempts atomically
            user.points = F('points') + points_to_add
            user.quiz_attempts = F('quiz_attempts') + 1
            user.save(update_fields=['points', 'quiz_attempts'])
            
            # Refresh user object to get updated values
            user.refresh_from_db()
        
        return Response({
            'success': True,
            'points_added': points_to_add,
            'total_points': user.points,
            'attempts': user.quiz_attempts,
            'quiz_type': quiz_type
        }, status=status.HTTP_200_OK)
    
class ClassStudentsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, class_id):
        """Get all students in a class"""
        try:
            # Verify the class exists and user has access (must be the teacher)
            class_obj = Class.objects.get(id=class_id)
            
            if request.user != class_obj.teacher:
                return Response(
                    {"error": "You don't have permission to view this class's students"},
                    status=status.HTTP_403_FORBIDDEN
                )
                
            # Get all students in the class
            students = class_obj.students.all()
            student_data = []
            
            for student in students:
                student_data.append({
                    "id": student.id,
                    "username": student.username,
                    "email": student.email,
                    "date_joined": student.date_joined,
                    "profile_photo_url": request.build_absolute_uri(student.profile_photo.url) if student.profile_photo else None
                })
                
            return Response({"students": student_data})
            
        except Class.DoesNotExist:
            return Response(
                {"error": "Class not found"},
                status=status.HTTP_404_NOT_FOUND
            )

class AddStudentToClassView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, class_id):
        """Add a student to a class by email"""
        try:
            email = request.data.get('email')
            if not email:
                return Response(
                    {"error": "Email is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Verify the class exists and user is the teacher
            class_obj = Class.objects.get(id=class_id)
            if request.user != class_obj.teacher:
                return Response(
                    {"error": "You don't have permission to add students to this class"},
                    status=status.HTTP_403_FORBIDDEN
                )
                
            # Find the student by email
            try:
                student = User.objects.get(email=email, user_type='student')
            except User.DoesNotExist:
                return Response(
                    {"error": "No student found with this email"},
                    status=status.HTTP_404_NOT_FOUND
                )
                
            # Check if student is already in another class
            if student.enrolled_classes.exists():
                return Response(
                    {"error": "This student is already enrolled in another class"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Add student to class
            class_obj.students.add(student)
            
            return Response({
                "success": True,
                "message": f"Student {student.username} added to class",
                "student": {
                    "id": student.id,
                    "username": student.username,
                    "email": student.email
                }
            })
            
        except Class.DoesNotExist:
            return Response(
                {"error": "Class not found"},
                status=status.HTTP_404_NOT_FOUND
            )

class RemoveStudentFromClassView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def delete(self, request, class_id, student_id):
        """Remove a student from a class"""
        try:
            # Verify the class exists and user is the teacher
            class_obj = Class.objects.get(id=class_id)
            if request.user != class_obj.teacher:
                return Response(
                    {"error": "You don't have permission to remove students from this class"},
                    status=status.HTTP_403_FORBIDDEN
                )
                
            # Find the student
            try:
                student = User.objects.get(id=student_id, user_type='student')
            except User.DoesNotExist:
                return Response(
                    {"error": "Student not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
                
            # Check if student is in this class
            if student not in class_obj.students.all():
                return Response(
                    {"error": "This student is not enrolled in this class"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Remove student from class
            class_obj.students.remove(student)
            
            return Response({
                "success": True,
                "message": f"Student {student.username} removed from class"
            })
            
        except Class.DoesNotExist:
            return Response(
                {"error": "Class not found"},
                status=status.HTTP_404_NOT_FOUND
            )
            
class GalistLeaderboardView(APIView):
    """Get top leaderboard entries"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Get top 10 entries (or specify limit via query param)
        limit = int(request.query_params.get('limit', 10))
        
        # Get leaderboard entries ordered by score (desc) then time (asc)
        leaderboard = GalistLeaderboard.objects.select_related('user').order_by('-score', 'time_elapsed')[:limit]
        
        serializer = GalistLeaderboardSerializer(leaderboard, many=True, context={'request': request})
        return Response(serializer.data)

class GalistLeaderboardSubmitView(APIView):
    """Submit a new leaderboard score"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = GalistLeaderboardCreateSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            entry = serializer.save()
            
            # Return the created entry with full details
            response_serializer = GalistLeaderboardSerializer(entry, context={'request': request})
            
            return Response({
                'success': True,
                'message': 'Score submitted successfully',
                'entry': response_serializer.data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserGalistScoresView(APIView):
    """Get current user's leaderboard entries"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        scores = GalistLeaderboard.objects.filter(user=request.user).order_by('-score', 'time_elapsed')
        serializer = GalistLeaderboardSerializer(scores, many=True, context={'request': request})
        
        # Get user's best score
        best_score = scores.first() if scores.exists() else None
        
        return Response({
            'scores': serializer.data,
            'best_score': GalistLeaderboardSerializer(best_score, context={'request': request}).data if best_score else None,
            'total_attempts': scores.count()
        })