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
        and identifies active stressors using sentence-level NLP analysis.
        
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

        # 1. Analyze text using new sentence-by-sentence NLP
        from ai.utils.preprocessing import analyze_text_nlp
        nlp_res = analyze_text_nlp(text)
        
        # 2. Clean, tokenize, and lemmatize text for top raw keywords and themes
        preprocess_res = preprocess_text(text)
        tokens = preprocess_res["tokens"]

        detected_themes = set()
        for token in tokens:
            for theme, kws in cls.THEME_KEYWORDS.items():
                if token in kws:
                    detected_themes.add(theme)

        if not tokens:
            return {
                "topics": ["Personal Reflections"],
                "stressors": [],
                "keywords": []
            }

        # Count frequencies of tokens to extract top keywords
        counter = Counter(tokens)
        top_kws = [word for word, count in counter.most_common() if len(word) > 2]
        
        # Deduce stressors based on sentence-level stress_sources
        stressors = []
        sentences = nlp_res.get("sentences", []) if isinstance(nlp_res, dict) else []
        if isinstance(sentences, list):
            for sent in sentences:
                if isinstance(sent, dict):
                    for stress_topic in sent.get("stress_sources", []):
                        t_capital = stress_topic.capitalize()
                        if t_capital in ["Work", "Career"]:
                            stressors.append("Workload pressure")
                        elif t_capital == "Finance":
                            stressors.append("Financial stress")
                        elif t_capital in ["Exam", "Study"]:
                            stressors.append("Academic pressure")
                        elif t_capital in ["Relationship", "Family"]:
                            stressors.append("Interpersonal relationship friction")
                        elif t_capital == "Sleep":
                            stressors.append("Sleep quality issues")
                        elif t_capital == "Health":
                            stressors.append("Physical health concern")
                        elif t_capital in ["Stress", "Anxiety"]:
                            stressors.append("Emotional overload")

        return {
            "topics": list(detected_themes) if detected_themes else ["Personal Reflections"],
            "stressors": list(set(stressors)),
            "keywords": top_kws[:10]  # Return top 10 keywords
        }
