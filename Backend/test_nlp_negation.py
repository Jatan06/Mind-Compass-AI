import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from ai.utils.preprocessing import analyze_text_nlp

tests = [
    "I am very stressed about my exam.",
    "I am NOT stressed today.",
    "I am totally anxious and freaking out.",
    "I am not anxious anymore.",
    "I am no longer worried.",
    "I am feeling much better.",
]

for t in tests:
    res = analyze_text_nlp(t)
    print(f"\nText: {t}")
    print(f"Sentiment: {res['sentiment']}")
    print(f"Emotion: {res['primary_emotion']}")
    sent_topics = [t for s in res.get('sentences', []) for t in s.get('topics', [])]
    print(f"Themes/Topics: {list(set(sent_topics))}")
