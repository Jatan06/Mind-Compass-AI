import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mindCompass.settings")
django.setup()

from activities.models import TherapyActivity

acts = TherapyActivity.objects.all()
for a in acts:
    if "exam" in a.title.lower() or "exam" in a.category.lower() or a.topics and any("exam" in t.lower() for t in a.topics):
        print(f"ID: {a.id}, Title: {a.title}, Category: {a.category}, Topics: {a.topics}")
        
print("--- Check all --")
for a in acts:
    if "exam" in a.title.lower():
        print(f"ID: {a.id}, Title: {a.title}, Category: {a.category}")
