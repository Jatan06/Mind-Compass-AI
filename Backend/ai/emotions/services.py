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
        if not text or not text.strip():
            return {
                "primary_emotion": "Calm",
                "secondary_emotion": "Hopeful",
                "confidence": 1.0
            }

        # Run NLP preprocessing tokenization
        preprocess_res = preprocess_text(text)
        tokens = preprocess_res["tokens"]
        cleaned_text = preprocess_res["cleaned_text"]

        # Run sentiment helper to guide default/fallback predictions
        sentiment_res = SentimentAnalysisService.analyze(text)
        sentiment = sentiment_res["sentiment"]
        sent_confidence = sentiment_res["confidence"]

        # Count keyword occurrences for each emotion category
        scores = {emotion: 0 for emotion in cls.EMOTION_KEYWORDS}
        
        # Match tokens against lemmatized keywords
        for token in tokens:
            for emotion, keywords in cls.EMOTION_KEYWORDS.items():
                if token in keywords:
                    scores[emotion] += 1

        # Sort candidate emotions by match frequency
        sorted_emotions = sorted(scores.items(), key=lambda item: item[1], reverse=True)
        top_emotion, top_score = sorted_emotions[0]
        second_emotion, second_score = sorted_emotions[1]

        # Determine output primary and secondary emotions
        primary = None
        secondary = None
        confidence = 0.5

        if top_score > 0:
            primary = top_emotion
            if second_score > 0:
                secondary = second_emotion
            else:
                # Deduce secondary based on VADER polarity if no secondary keyword matched
                if sentiment == "Positive" and primary != "Happy":
                    secondary = "Happy"
                elif sentiment == "Negative" and primary != "Sad":
                    secondary = "Sad"
                else:
                    secondary = "Calm" if primary != "Calm" else "Hopeful"
            
            # Confidence calculation based on relative match density and VADER confidence
            total_score = sum(scores.values())
            confidence = (top_score / total_score) * 0.7 + (sent_confidence * 0.3)
        else:
            # Fallback logic using VADER polarity context when no direct keywords matched
            if sentiment == "Positive":
                primary = "Calm"
                secondary = "Happy"
            elif sentiment == "Negative":
                primary = "Sad"
                secondary = "Anxiety"
            else:
                primary = "Calm"
                secondary = "Hopeful"
            confidence = sent_confidence

        # Prevent primary equals secondary
        if primary == secondary:
            secondary = "Hopeful" if primary != "Hopeful" else "Calm"

        return {
            "primary_emotion": primary,
            "secondary_emotion": secondary,
            "confidence": round(float(confidence), 2)
        }
