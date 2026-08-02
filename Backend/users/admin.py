from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserProfile

class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profiles'

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)
    list_display = ('username', 'email', 'google_id', 'is_staff')
    search_fields = ('username', 'email', 'google_id')

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'occupation', 'sleep_hours', 'streak', 'wellness_score', 'is_onboarded')
    list_filter = ('is_onboarded', 'occupation')
    search_fields = ('user__username', 'user__email')
