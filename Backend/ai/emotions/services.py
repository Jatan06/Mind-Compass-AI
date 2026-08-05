from ai.utils.preprocessing import preprocess_text
from ai.sentiment.services import SentimentAnalysisService

class EmotionDetectionService:
    # Dictionary mapping target emotions to lists of lowercase lemmatized keyword stems
    EMOTION_KEYWORDS = {
        "Happy": {"happy", "glad", "joy", "joyful", "cheerful", "content", "contentment", "delight", "pleased", "celebrate", "smile", "laugh", "good", "great"},
        "Sad": {"sad", "sadness", "cry", "crying", "tear", "sorrow", "unhappy", "blue", "weep", "gloom", "depressed", "depression", "grief", "mourn"},
        "Angry": {"angry", "anger", "mad", "annoy", "annoyed", "furious", "rage", "outrage", "irritated", "irritation", "hate", "hostile"},
        "Fear": {"fear", "afraid", "scared", "fright", "terrified", "terror", "panic", "threat", "dread", "horror"},
        "Anxiety": {"anxious", "anxiety", "worry", "worried", "nervous", "nervousness", "tension", "tense", "uneasy", "apprehensive", "jittery"},
        "Stress": {"stress", "stressed", "stressful", "pressure", "strain", "burnout", "busy", "exhausted", "fatigue", "tire", "tired"},
        "Calm": {"calm", "peace", "peaceful", "serene", "serenity", "quiet", "relax", "relaxed", "relaxing", "unwind", "tranquil", "still", "soothe"},
        "Hopeful": {"hope", "hopeful", "optimistic", "optimism", "future", "faith", "promise", "forward", "positive", "believe", "belief"},
        "Frustrated": {"frustrated", "frustration", "exasperated", "disappointed", "disappointment", "stuck", "bottleneck", "annoying"},
        "Lonely": {"lonely", "loneliness", "alone", "isolated", "isolation", "solitary", "empty", "friendless", "excluded"},
        "Excited": {"excited", "excitement", "thrilled", "thrill", "eager", "passionate", "enthusiasm", "enthusiastic", "hype", "pumped"},
        "Overwhelmed": {"overwhelmed", "overwhelming", "drown", "drowning", "collapse", "bury", "buried", "helpless", "struggle", "struggling"}
    }

    @classmethod
    def detect(cls, text):
        """
        Modular entry point for detecting primary and secondary emotions.
        Can be easily updated to delegate to a transformer pipeline in the future.
        """
        return cls._rule_based_detect(text)

    @classmethod
    def _rule_based_detect(cls, text):
        from ai.utils.preprocessing import analyze_text_nlp
        res = analyze_text_nlp(text)
        return {
            "primary_emotion": res["primary_emotion"],
            "secondary_emotion": res["secondary_emotion"],
            "confidence": res["confidence"]
        }

