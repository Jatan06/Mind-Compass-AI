from django.contrib import admin
from .models import JournalEntry

@admin.register(JournalEntry)
class JournalEntryAdmin(admin.ModelAdmin):
    list_display = ('user', 'date', 'is_voice', 'created_at')
    list_filter = ('is_voice', 'date')
    search_fields = ('user__username', 'user__email', 'text')
    readonly_fields = ('created_at', 'updated_at')
