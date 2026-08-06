from typing import Any
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = "Deletes all unverified user accounts from the database."

    def handle(self, *args: Any, **options: Any) -> None:
        style: Any = self.style
        unverified_users = User.objects.filter(profile__is_email_verified=False)
        count = unverified_users.count()
        if count == 0:
            self.stdout.write(style.SUCCESS("No unverified accounts found."))
            return

        emails = list(unverified_users.values_list('email', flat=True))
        unverified_users.delete()
        self.stdout.write(
            style.SUCCESS(f"Successfully deleted {count} unverified account(s): {', '.join(emails)}")
        )

