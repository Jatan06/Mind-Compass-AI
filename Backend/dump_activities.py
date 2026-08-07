"""Dump all activity metadata to understand scoring behavior."""
import os, sys, django, json
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from activities.models import TherapyActivity

for a in TherapyActivity.objects.all().order_by('id'):
    print(f"ID={a.id} | Title={a.title} | Cat={a.category}")
    print(f"  mood_range={a.mood_range} stress_range={a.stress_range}")
    print(f"  topics={a.topics} emotions={a.emotions}")
    print(f"  agg_avg_improvement={a.agg_avg_improvement} agg_completed={a.agg_completed} agg_started={a.agg_started} agg_total_recs={a.agg_total_recommendations}")
    print()
