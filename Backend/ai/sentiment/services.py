from nltk.sentiment.vader import SentimentIntensityAnalyzer
from ai.utils.preprocessing import preprocess_text

class SentimentAnalysisService:
    _sia = None

    @classmethod
    def get_sia(cls):
        if cls._sia is None:
            cls._sia = SentimentIntensityAnalyzer()
        return cls._sia

    @classmethod
    def analyze(cls, text):
        """
        Performs VADER sentiment intensity analysis on cleaned journal entry text.
        
        Returns:
            dict: {
                "sentiment": "Positive" | "Negative" | "Neutral",
                "scores": {
                    "positive": float,
                    "neutral": float,
                    "negative": float,
                    "compound": float
                },
                "confidence": float
            }
        """
        if not text or not text.strip():
            return {
                "sentiment": "Neutral",
                "scores": {
                    "positive": 0.0,
                    "neutral": 1.0,
                    "negative": 0.0,
                    "compound": 0.0
                },
                "confidence": 1.0
            }

        # Preprocess text (cleans HTML, URLs, emojis, and normalizes space)
        preprocess_res = preprocess_text(text)
        cleaned_text = preprocess_res["cleaned_text"]

        if not cleaned_text.strip():
            return {
                "sentiment": "Neutral",
                "scores": {
                    "positive": 0.0,
                    "neutral": 1.0,
                    "negative": 0.0,
                    "compound": 0.0
                },
                "confidence": 1.0
            }

        sia = cls.get_sia()
        vader_scores = sia.polarity_scores(cleaned_text)

        compound = vader_scores["compound"]

        # Lowercase versions of text for phrase matching
        text_lower = text.lower().strip()

        # Context phrase detection for loneliness, isolation, low motivation, emotional withdrawal
        negation_words = {"not", "don't", "dont", "never", "no", "cannot", "cant", "can't", "won't", "wont", "neither", "nor"}
        words = text_lower.split()
        
        # Check if the text contains explicit negative emotional keywords as a fallback/cue to replace the primary_emotion check
        negative_words = {"sad", "depressed", "depression", "miserable", "down", "unhappy", "angry", "mad", "furious", "frustrated", "anxious", "anxiety", "worried", "worry", "scared", "fear", "afraid", "overwhelmed", "stressed", "stress", "grief", "lonely", "loneliness"}
        has_negative_word = any(w in words for w in negative_words)

        # 1. Phrases for loneliness / isolation / withdrawal
        loneliness_phrases = [
            "want to be alone", "want to be left alone", "wish to be alone", "wanted to be alone",
            "feel lonely", "feeling lonely", "feel alone", "feeling alone",
            "resting and want to be alone", "resting and want to be left alone",
            "want to isolate", "feeling isolated", "feel isolated",
            "loneliness", "isolated", "isolation", "withdrawal", "withdrawing"
        ]
        has_loneliness_cue = any(phrase in text_lower for phrase in loneliness_phrases)

        # 2. Phrases for low motivation / doing nothing / sleeping all day
        low_motivation_phrases = [
            "don't want to do anything", "don't feel like doing anything", "dont want to do anything",
            "dont feel like doing anything", "do not want to do anything", "do not feel like doing anything",
            "want to sleep all day", "want to stay in bed", "just want to sleep", "sleep all day",
            "stay in bed", "no motivation", "lost motivation", "loss of motivation",
            "cannot get out of bed", "can't get out of bed", "tired of everything", "tired of trying"
        ]
        has_withdrawal_cue = any(phrase in text_lower for phrase in low_motivation_phrases)

        # 3. Negations of positive emotions / conditions
        has_positive_negation = False
        for i, w in enumerate(words):
            if w in negation_words and i + 1 < len(words):
                next_word = words[i+1]
                if next_word in ["happy", "good", "well", "fine", "ok", "okay", "glad", "joy", "excited", "peaceful", "calm"]:
                    has_positive_negation = True

        # Combine signals:
        # Negative signals
        is_negative_context = (
            has_loneliness_cue or 
            has_withdrawal_cue or 
            has_positive_negation or 
            has_negative_word
        )

        # Positive signals
        has_positive_words = any(w in text_lower for w in ["happy", "wonderful", "great", "good", "glad", "joy", "excited", "satisfied", "blessed", "refresh"])
        
        # Mixed context detection like "tired but happy", "stressed but glad", "exhausted but wonderful"
        is_mixed_context = has_positive_words and any(w in text_lower for w in ["tired", "exhausted", "fatigue", "stressed", "weary", "busy"])

        # Determine sentiment
        if is_mixed_context:
            sentiment = "Positive"  # Mixed / Slightly Positive maps to Positive/Neutral
            confidence = 0.75
        elif is_negative_context:
            sentiment = "Negative"
            confidence = 0.85
        else:
            # Fall back to standard VADER
            if compound >= 0.05:
                sentiment = "Positive"
                confidence = max(0.5, (compound + 1) / 2)
            elif compound <= -0.05:
                sentiment = "Negative"
                confidence = max(0.5, (abs(compound) + 1) / 2)
            else:
                sentiment = "Neutral"
                confidence = 1.0 - abs(compound)

        return {
            "sentiment": sentiment,
            "scores": {
                "positive": float(vader_scores["pos"]),
                "neutral": float(vader_scores["neu"]),
                "negative": float(vader_scores["neg"]),
                "compound": float(compound)
            },
            "confidence": round(float(confidence), 2)
        }
