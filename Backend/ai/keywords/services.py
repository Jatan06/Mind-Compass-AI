from collections import Counter
from ai.utils.preprocessing import preprocess_text

class KeywordExtractionService:
    # Dictionary mapping target themes to their corresponding trigger lemmatized keywords
    THEME_KEYWORDS = {
        "Sleep": {"sleep", "insomnia", "tired", "rest", "fatigue", "exhausted", "bed", "dream", "awake", "night"},
        "Work": {"work", "job", "office", "boss", "colleague", "meeting", "task", "project", "deadline", "career"},
        "Exam": {"exam", "test", "quiz", "grade", "midterm", "final", "study", "cramming", "prepare"},
        "Relationship": {"relationship", "partner", "spouse", "love", "divorce", "dating", "argument", "fight", "heartbreak"},
        "Family": {"family", "mother", "father", "mom", "dad", "parent", "sibling", "brother", "sister", "child", "son", "daughter"},
        "Finance": {"finance", "money", "bill", "cost", "salary", "spend", "debt", "budget", "broke", "expensive"},
        "Health": {"health", "sick", "doctor", "medicine", "pain", "injury", "illness", "clinical", "hospital"},
        "Friends": {"friend", "buddy", "meetup", "hangout", "social", "party", "gathering"},
        "Career": {"career", "promotion", "resume", "interview", "hire", "unemployed", "salary"},
        "Loneliness": {"lonely", "loneliness", "alone", "isolated", "isolation", "solitary", "friendless"},
        "Stress": {"stress", "stressed", "stressful", "overwhelmed", "pressure", "burnout", "anxious"},
        "Anxiety": {"anxiety", "anxious", "worry", "worried", "fear", "panic", "dread"},
        "Study": {"study", "learn", "class", "lecture", "homework", "school", "university", "college"},
        "Exercise": {"exercise", "workout", "gym", "run", "running", "walk", "jog", "lift", "fitness", "yoga"},
        "Food": {"food", "eat", "meal", "dinner", "lunch", "breakfast", "diet", "nutrition", "hungry"},
        "Hydration": {"hydration", "water", "drink", "dehydrated", "hydrated", "glass", "liquid"}
    }

    @classmethod
    def extract(cls, text):
        """
        Extracts top keywords, matches them with configured wellness themes,
        and identifies active stressors.
        
        Returns:
            dict: {
                "topics": list of matched themes,
                "stressors": list of identified stress topics,
                "keywords": list of top count preprocessed words
            }
        """
        if not text or not text.strip():
            return {
                "topics": [],
                "stressors": [],
                "keywords": []
            }

        # Clean, tokenize, and lemmatize text
        preprocess_res = preprocess_text(text)
        tokens = preprocess_res["tokens"]

        if not tokens:
            return {
                "topics": ["Personal Reflections"],
                "stressors": [],
                "keywords": []
            }

        # Find matching themes in the preprocessed tokens
        detected_themes = set()
        for token in tokens:
            for theme, keywords in cls.THEME_KEYWORDS.items():
                if token in keywords:
                    detected_themes.add(theme)

        # Count frequencies of tokens to extract top keywords
        counter = Counter(tokens)
        # Filter for words longer than 2 characters
        top_kws = [word for word, count in counter.most_common() if len(word) > 2]
        
        # Deduce stressors based on active themes
        stressors = []
        if "Work" in detected_themes or "Career" in detected_themes:
            stressors.append("Workload pressure")
        if "Finance" in detected_themes:
            stressors.append("Financial stress")
        if "Exam" in detected_themes or "Study" in detected_themes:
            stressors.append("Academic pressure")
        if "Relationship" in detected_themes or "Family" in detected_themes:
            stressors.append("Interpersonal relationship friction")
        if "Sleep" in detected_themes:
            stressors.append("Sleep quality issues")
        if "Health" in detected_themes:
            stressors.append("Physical health concern")
        if "Stress" in detected_themes or "Anxiety" in detected_themes:
            stressors.append("Emotional overload")

        return {
            "topics": list(detected_themes) if detected_themes else ["Personal Reflections"],
            "stressors": list(set(stressors)),
            "keywords": top_kws[:10]  # Return top 10 keywords
        }
