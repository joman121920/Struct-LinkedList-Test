from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import Class, GalistLeaderboard

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'confirm_password', 'user_type')
        extra_kwargs = {
            'user_type': {'required': True}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})

        return attrs

    def create(self, validated_data):
        # Remove confirm_password from the data
        validated_data.pop('confirm_password', None)

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            user_type=validated_data['user_type']
        )

        user.set_password(validated_data['password'])
        user.save()

        return user
    
class UserProfileSerializer(serializers.ModelSerializer):
    profile_photo_url = serializers.SerializerMethodField()
    next_heart_in = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'user_type', 'profile_photo_url', 
                 'points', 'hearts', 'max_hearts', 'hints', 'next_heart_in',
                 'hearts_gained_today', 'max_daily_hearts')
    
    def get_profile_photo_url(self, user):
        if user.profile_photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(user.profile_photo.url)
        return None
    
    def get_next_heart_in(self, user):
        """Return time until next heart regeneration in milliseconds"""
        return user.get_next_heart_time()

class UserHeartSerializer(serializers.ModelSerializer):
    next_heart_in = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['hearts', 'max_hearts', 'last_heart_regen_time', 'next_heart_in', 'hearts_gained_today', 'max_daily_hearts']
    
    def get_next_heart_in(self, user):
        """Return time until next heart regeneration in milliseconds"""
        return user.get_next_heart_time()

class ProfilePhotoUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['profile_photo']

class ClassSerializer(serializers.ModelSerializer):
    students_count = serializers.SerializerMethodField()

    class Meta:
        model = Class
        fields = ['id', 'name', 'description', 'code', 'created_at', 'students_count']
        read_only_fields = ['code']

    def get_students_count(self, obj):
        return obj.students.count()

class ClassCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Class
        fields = ['id', 'name', 'description', 'code']
        read_only_fields = ['code']

    def create(self, validated_data):
        # Set the current user as the teacher
        user = self.context['request'].user
        validated_data['teacher'] = user
        return super().create(validated_data)

class GalistLeaderboardSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    profile_photo_url = serializers.SerializerMethodField()
    formatted_time = serializers.SerializerMethodField()
    
    class Meta:
        model = GalistLeaderboard
        fields = ['id', 'username', 'score', 'time_elapsed', 'formatted_time', 'created_at', 'profile_photo_url']
        read_only_fields = ['id', 'created_at']
    
    def get_profile_photo_url(self, obj):
        if obj.user.profile_photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.user.profile_photo.url)
        return None
    
    def get_formatted_time(self, obj):
        return obj.get_formatted_time()

class GalistLeaderboardCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = GalistLeaderboard
        fields = ['score', 'time_elapsed']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)