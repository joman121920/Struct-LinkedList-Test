# api/urls.py
from django.urls import path
from .views import UserRegistrationView, LoginView, ClassCreateView, JoinClassView, UserClassesView, DeleteClassView, LeaveClassView, UserHeartsView, PointsUpdateView, GalistLeaderboardView, GalistLeaderboardSubmitView, UserGalistScoresView
from . import views

# These URLs will be included under the /api/ prefix
urlpatterns = [
    # Authentication
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),

    # Profile Management
    path('user/profile/', views.UserProfileView.as_view(), name='user_profile'),
    path('user/update-profile-photo/', views.update_profile_photo, name='update_profile_photo'),

    # Heart Management
    path('user/hearts/', UserHeartsView.as_view(), name='user_hearts'),

    # Class Management
    path('classes/create/', ClassCreateView.as_view(), name='create_class'),
    path('classes/join/', JoinClassView.as_view(), name='join_class'),
    path('classes/user/', UserClassesView.as_view(), name='user_classes'),
    path('classes/delete/<int:pk>/', DeleteClassView.as_view(), name='delete_class'),
    path('classes/leave/<int:pk>/', LeaveClassView.as_view(), name='leave_class'),

    path('classes/<int:class_id>/students/', views.ClassStudentsView.as_view(), name='class_students'),
    path('classes/<int:class_id>/add-student/', views.AddStudentToClassView.as_view(), name='add_student_to_class'),
    path('classes/<int:class_id>/remove-student/<int:student_id>/', views.RemoveStudentFromClassView.as_view(), name='remove_student_from_class'),


    # points update for pfp
    path('update-points/', PointsUpdateView.as_view(), name='update_points'),
    
    # Galist Leaderboard
    path('galist/leaderboard/', GalistLeaderboardView.as_view(), name='galist_leaderboard'),
    path('galist/leaderboard/submit/', GalistLeaderboardSubmitView.as_view(), name='galist_leaderboard_submit'),
    path('galist/user-scores/', UserGalistScoresView.as_view(), name='user_galist_scores'),
]
