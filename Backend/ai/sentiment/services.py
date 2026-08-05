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

        from ai.utils.preprocessing import analyze_text_nlp
        nlp_res = analyze_text_nlp(text)

        sia = cls.get_sia()
        vader_scores = sia.polarity_scores(cleaned_text)

        return {
            "sentiment": nlp_res["sentiment"],
            "scores": {
                "positive": float(vader_scores["pos"]),
                "neutral": float(vader_scores["neu"]),
                "negative": float(vader_scores["neg"]),
                "compound": float(vader_scores["compound"])
            },
            "confidence": nlp_res["confidence"]
        }

