from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.utils import timezone
import random
import string
import datetime

class User(AbstractUser):
    USER_TYPE_CHOICES = (
        ('student', 'Student'),
        ('teacher', 'Teacher'),
        ('admin', 'Admin'),
    )

    email = models.EmailField(_('email address'), unique=True)
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='student')
    profile_photo = models.ImageField(upload_to='profile_photos/', null=True, blank=True)
    points = models.IntegerField(default=0)
    hearts = models.IntegerField(default=3)
    hints = models.IntegerField(default=3)
    # New fields for heart regeneration
    max_hearts = models.IntegerField(default=10)  # Maximum hearts a user can have
    last_heart_regen_time = models.DateTimeField(default=timezone.now)  # When the last heart regenerated
    # Add this new field to track daily heart regeneration
    hearts_gained_today = models.IntegerField(default=0)
    hearts_reset_date = models.DateTimeField(default=timezone.now)  # Changed from DateField to DateTimeField
    # Maximum hearts a user can gain in a day (limit)
    max_daily_hearts = models.IntegerField(default=3)
    quiz_attempts = models.IntegerField(default=0)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'user_type']

    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')

    def __str__(self):
        return self.email
        
    @property
    def profile_photo_url(self):
        if self.profile_photo:
            return self.profile_photo.url
        return None
        
    def regenerate_hearts(self):
        """Regenerate hearts based on time elapsed since last regeneration"""
      
        
        # Check if we need to reset daily heart counter
        self.reset_daily_hearts_if_needed()
        
        # If hearts are already at max, nothing to do
        if self.hearts >= self.max_hearts:
            return
        
        # Calculate time elapsed since last heart regeneration
        now = timezone.now()
        if not self.last_heart_regen_time:
            self.last_heart_regen_time = now
            self.save(update_fields=['last_heart_regen_time'])
            return
        
        # Get time difference in minutes
        time_diff = (now - self.last_heart_regen_time).total_seconds() / 60
        heart_regen_minutes = 30  # Time in minutes to regenerate one heart
        
        # IMPORTANT: Add a safeguard to prevent instant regeneration when hearts_gained_today is manually reset
        # If this appears to be the first regeneration after a counter reset (hearts_gained_today is 0 but hearts < max_hearts)
        # and it hasn't been at least heart_regen_minutes since the last regeneration
        if self.hearts_gained_today == 0 and self.hearts < self.max_hearts and time_diff < heart_regen_minutes:
            # Don't allow instant regeneration - enforce waiting period
            return
        
        # Calculate how many hearts to add based on time passed
        hearts_to_add = int(time_diff / heart_regen_minutes)
        
        # If no hearts should be added based on time passed, return early
        if hearts_to_add <= 0:
            return
            
        # Check if we've reached daily limit
        remaining_daily_hearts = self.max_daily_hearts - self.hearts_gained_today
        hearts_to_add = min(hearts_to_add, remaining_daily_hearts)
        
        if hearts_to_add <= 0:
            return  # Daily limit reached
            
        # Add hearts, but don't exceed max
        new_hearts = min(self.hearts + hearts_to_add, self.max_hearts)
        hearts_added = new_hearts - self.hearts
        
        if hearts_added > 0:
            self.hearts = new_hearts
            self.hearts_gained_today += hearts_added
            
            # Update the last regen time based on complete intervals only
            self.last_heart_regen_time = self.last_heart_regen_time + timezone.timedelta(
                minutes=hearts_added * heart_regen_minutes
            )
            
            self.save(update_fields=['hearts', 'last_heart_regen_time', 'hearts_gained_today'])
            
    def get_next_heart_time(self):
        """Calculate time until next heart regeneration"""
        # No regeneration if at max hearts or daily limit reached
        if self.hearts >= self.max_hearts or self.hearts_gained_today >= self.max_daily_hearts:
            return None
            
        # Calculate when the next heart will be available
        next_heart_time = self.last_heart_regen_time + timezone.timedelta(minutes=30)
        #next_heart_time = self.last_heart_regen_time + timezone.timedelta(minutes=1)
        time_remaining = next_heart_time - timezone.now()
        
        # Return milliseconds for easy frontend use
        return max(0, time_remaining.total_seconds() * 1000) if time_remaining.total_seconds() > 0 else 0

    def reset_daily_hearts_if_needed(self):
        """Reset hearts_gained_today at 8AM each day"""
        now = timezone.now()
        today = now.date()
        
        # Create today's reset time (8AM today)
        todays_reset = timezone.make_aware(
            datetime.datetime.combine(today, datetime.time(hour=8, minute=0))
        )
        
        # If we're before 8AM, we should compare with yesterday's 8AM
        if now.hour < 8:
            todays_reset = todays_reset - timezone.timedelta(days=1)
        
        # If the last reset was before today's reset time (8AM)
        if self.hearts_reset_date < todays_reset:
            # Only reset the counter, don't give hearts immediately
            self.hearts_gained_today = 0
            self.hearts_reset_date = now
            
            # Don't update hearts or last_heart_regen_time here
            # This ensures that when hearts_gained_today is reset, 
            # hearts still regenerate according to the timer
            self.save(update_fields=['hearts_gained_today', 'hearts_reset_date'])

def post(self, request):
        try:
            points_to_add = request.data.get('score', 0)
            quiz_type = request.data.get('quiz_type', 'unknown')
            
            if not isinstance(points_to_add, (int, float)) or points_to_add < 0:
                return Response({
                    'success': False,
                    'error': 'Invalid score value'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user = request.user
            
            with transaction.atomic():
                user.points = F('points') + points_to_add
                user.quiz_attempts = F('quiz_attempts') + 1
                user.save(update_fields=['points', 'quiz_attempts'])
                user.refresh_from_db()
            
            return Response({
                'success': True,
                'points_added': points_to_add,
                'total_points': user.points,
                'attempts': user.quiz_attempts,
                'quiz_type': quiz_type
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
def get(self, request):
        user = request.user
        # Force refresh from database to get latest values
        user.refresh_from_db()
        
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'user_type': user.user_type,
            'points': user.points,
            'hearts': user.hearts,
            'hints': user.hints,
            'quiz_attempts': getattr(user, 'quiz_attempts', 0),
            'profile_photo_url': user.profile_photo.url if user.profile_photo else None,
        })

def generate_class_code():
    """Generate a random 6-character alphanumeric class code"""
    characters = string.ascii_uppercase + string.digits
    return ''.join(random.choice(characters) for _ in range(6))

class Class(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    code = models.CharField(max_length=10, unique=True, default=generate_class_code)
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='teaching_classes')
    students = models.ManyToManyField(User, related_name='enrolled_classes', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.code})"

class GalistLeaderboard(models.Model):
    """Model to store Galist game leaderboard entries"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='galist_scores')
    score = models.IntegerField(default=0)
    time_elapsed = models.IntegerField(help_text="Time in seconds")  # Store time in seconds
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-score', 'time_elapsed']  # Order by highest score, then fastest time
        verbose_name = 'Galist Leaderboard Entry'
        verbose_name_plural = 'Galist Leaderboard Entries'
    
    def __str__(self):
        minutes = self.time_elapsed // 60
        seconds = self.time_elapsed % 60
        return f"{self.user.username} - {self.score} points ({minutes}:{seconds:02d})"
    
    def get_formatted_time(self):
        """Return time in MM:SS format"""
        minutes = self.time_elapsed // 60
        seconds = self.time_elapsed % 60
        return f"{minutes}:{seconds:02d}"