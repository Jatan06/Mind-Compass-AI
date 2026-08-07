import json
from activities.models import TherapyActivity

activities = list(TherapyActivity.objects.values('id', 'title', 'category', 'difficulty', 'duration'))
with open('filtered_activities.json', 'w', encoding='utf-8') as f:
    json.dump(activities, f, indent=4)
