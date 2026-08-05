import os
import django
import sys

# Setup django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from ai.utils.preprocessing import analyze_text_nlp
from ai.keywords.services import KeywordExtractionService

def run_verification():
    print("====================================================")
    print("RUNNING REFINED SENTENCE-BY-SENTENCE NLP PIPELINE VERIFICATION")
    print("====================================================")

    # 1. "I am not stressed anymore." -> Expected Calm
    res_1 = analyze_text_nlp("I am not stressed anymore.")
    assert len(res_1["sentences"]) == 1, "Should have 1 sentence"
    s1 = res_1["sentences"][0]
    print(f"Case 1: {s1['text']} -> Emotion: {s1['emotion']}, Sentiment: {s1['sentiment']}")
    assert s1["emotion"] == "Calm", f"Expected Calm, got {s1['emotion']}"

    # 2. "I wasn't lonely today." -> Expected Connected
    res_2 = analyze_text_nlp("I wasn't lonely today.")
    assert len(res_2["sentences"]) == 1
    s2 = res_2["sentences"][0]
    print(f"Case 2: {s2['text']} -> Emotion: {s2['emotion']}, Sentiment: {s2['sentiment']}")
    assert s2["emotion"] == "Connected", f"Expected Connected, got {s2['emotion']}"

    # 3. "I used to feel anxious but today I feel relaxed." -> Expected relax/relaxed/Calm
    res_3 = analyze_text_nlp("I used to feel anxious but today I feel relaxed.")
    assert len(res_3["sentences"]) == 1
    s3 = res_3["sentences"][0]
    print(f"Case 3: {s3['text']} -> Emotion: {s3['emotion']}, Sentiment: {s3['sentiment']}")
    assert s3["emotion"] == "Relaxed", f"Expected Relaxed, got {s3['emotion']}"

    # 4. "I had very little work today." -> Topic = Work, Stress Source = None
    res_4 = analyze_text_nlp("I had very little work today.")
    s4 = res_4["sentences"][0]
    print(f"Case 4: {s4['text']} -> Topics: {s4['topics']}, Stress Sources: {s4['stress_sources']}")
    assert "work" in s4["topics"], "Expected topic work"
    assert "work" not in s4["stress_sources"], "Expected no stress source work"

    # 5. "I couldn't finish my work because of continuous deadlines." -> Topic = Work, Stress Source = Work
    res_5 = analyze_text_nlp("I couldn't finish my work because of continuous deadlines.")
    s5 = res_5["sentences"][0]
    print(f"Case 5: {s5['text']} -> Topics: {s5['topics']}, Stress Sources: {s5['stress_sources']}")
    assert "work" in s5["topics"], "Expected topic work"
    assert "work" in s5["stress_sources"], "Expected work to be a stress source"

    # 6. "My mother visited me today." -> Topic = Family, Positive
    res_6 = analyze_text_nlp("My mother visited me today.")
    s6 = res_6["sentences"][0]
    print(f"Case 6: {s6['text']} -> Topics: {s6['topics']}, Sentiment: {s6['sentiment']}")
    assert "family" in s6["topics"], "Expected topic family"
    assert s6["sentiment"] == "Positive", f"Expected Positive sentiment, got {s6['sentiment']}"

    # 7. "I played badminton with my friends." -> Topics = Exercise + Friends, Positive
    res_7 = analyze_text_nlp("I played badminton with my friends.")
    s7 = res_7["sentences"][0]
    print(f"Case 7: {s7['text']} -> Topics: {s7['topics']}, Sentiment: {s7['sentiment']}")
    assert "exercise" in s7["topics"], "Expected exercise topic"
    assert "friends" in s7["topics"], "Expected friends topic"
    assert s7["sentiment"] == "Positive", f"Expected Positive sentiment, got {s7['sentiment']}"

    print("\nALL 7 VALIDATION CASES PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_verification()
