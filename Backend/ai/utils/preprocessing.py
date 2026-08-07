import re
import string

try:
    from nltk.tokenize import word_tokenize
    from nltk.corpus import stopwords
    from nltk.stem import WordNetLemmatizer
    from nltk.sentiment.vader import SentimentIntensityAnalyzer
except ImportError:
    def word_tokenize(text):
        return re.findall(r'\b\w+\b|[^\w\s]', text)

    class DummyStopwords:
        @staticmethod
        def words(lang='english'):
            return {"i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", "he", "him", "his", "she", "her", "it", "its", "they", "them", "their", "what", "which", "who", "whom", "this", "that", "am", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an", "the", "and", "but", "if", "or", "because", "as", "until", "while", "of", "at", "by", "for", "with", "about", "against", "between", "into", "through", "during", "before", "after", "above", "below", "to", "from", "up", "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once"}

    stopwords = DummyStopwords()

    class WordNetLemmatizer:
        def lemmatize(self, word, pos='n'):
            return word.lower()

    class SentimentIntensityAnalyzer:
        def polarity_scores(self, text):
            return {"pos": 0.0, "neu": 1.0, "neg": 0.0, "compound": 0.0}


EMOTION_KEYWORDS = {
    "Happy": {"happy", "glad", "joy", "joyful", "cheerful", "content", "contentment", "delight", "pleased", "celebrate", "smile", "laugh", "good", "great"},
    "Sad": {"sad", "sadness", "cry", "crying", "tear", "sorrow", "unhappy", "blue", "weep", "gloom", "depressed", "depression", "grief", "mourn"},
    "Angry": {"angry", "anger", "mad", "annoy", "annoyed", "furious", "rage", "outrage", "irritated", "irritation", "hate", "hostile"},
    "Fear": {"fear", "afraid", "scared", "fright", "terrified", "terror", "panic", "threat", "dread", "horror"},
    "Anxiety": {"anxious", "anxiety", "worry", "worried", "nervous", "nervousness", "tension", "tense", "uneasy", "apprehensive", "jittery"},
    "Stress": {"stress", "stressed", "stressful", "pressure", "strain", "burnout", "busy"},
    "Calm": {"calm", "peace", "peaceful", "serene", "serenity", "quiet", "tranquil", "soothe"},
    "Hopeful": {"hope", "hopeful", "optimistic", "optimism", "future", "faith", "promise", "forward", "positive", "believe", "belief"},
    "Frustrated": {"frustrated", "frustration", "exasperated", "disappointed", "disappointment", "stuck", "bottleneck", "annoying"},
    "Lonely": {"lonely", "loneliness", "alone", "isolated", "isolation", "solitary", "empty", "friendless", "excluded"},
    "Excited": {"excited", "excitement", "thrilled", "thrill", "eager", "passionate", "enthusiasm", "enthusiastic", "hype", "pumped"},
    "Overwhelmed": {"overwhelmed", "overwhelming", "drown", "drowning", "collapse", "bury", "buried", "helpless", "struggle", "struggling"},
    "Confident": {"confident", "confidence", "assured", "bold", "proud", "secure", "certain", "sure"},
    "Grateful": {"grateful", "gratitude", "thank", "thankful", "blessed", "appreciate", "appreciated", "appreciation"},
    "Motivated": {"motivated", "motivation", "inspired", "driven", "focus", "determined", "ambitious", "productive"},
    "Emotionally exhausted": {"exhausted", "fatigue", "tired", "drain", "drained", "weary"},
    "Connected": {"connected", "belong", "loved", "supported", "understood", "sociable", "accompanied"},
    "Relaxed": {"relax", "relaxed", "relaxing", "unwind", "still"}
}

NEGATION_WORDS = {"not", "no", "never", "wasn't", "wasnt", "didn't", "didnt", "don't", "dont", "isn't", "isnt", "aren't", "arent", "haven't", "havent", "cannot", "cant", "can't", "won't", "wont", "neither", "nor", "no longer", "without", "not anymore", "stop", "nt", "n't"}
RECOVERY_PHRASES = ["getting better", "recovering", "sleeping better", "worrying less", "worry less", "feeling lighter", "improving", "feeling better", "felt better", "feel better", "not stressed anymore", "wasn't lonely anymore", "wasn't sad anymore", "getting well", "finally feel", "feel relaxed", "no longer", "not anymore", "much less", "worry much less", "feel lighter now"]
PAST_INDICATORS = {"yesterday", "last week", "used to", "before", "earlier", "previously", "was", "were", "had", "felt", "ago"}
FUTURE_INDICATORS = {"tomorrow", "next week", "will", "going to", "hope to", "plan to", "future", "would", "shall"}

NEGATION_EMOTION_MAP = {
    "Stress": "Calm",
    "Anxiety": "Calm",
    "Lonely": "Connected",
    "Sad": "Calm",
    "Frustrated": "Calm",
    "Angry": "Calm",
    "Overwhelmed": "Calm",
    "Fear": "Calm",
    "Emotionally exhausted": "Calm",
    "Happy": "Sad",
    "Calm": "Stress",
    "Relaxed": "Stress",
    "Hopeful": "Sad",
    "Excited": "Sad",
    "Confident": "Anxiety",
    "Grateful": "Sad",
    "Motivated": "Sad",
    "Connected": "Lonely"
}

def preprocess_text(text):
    """
    Cleans raw journal text by lowercasing, removing HTML tags, URLs,
    emojis, redundant white space, punctuation, English stop-words, 
    and applying WordNet lemmatization.
    """
    if not text:
        return {
            "cleaned_text": "",
            "tokens": []
        }
        
    cleaned = re.sub(r'<[^>]*>', '', text)
    cleaned = re.sub(r'https?://\S+|www\.\S+', '', cleaned)
    emoji_pattern = re.compile(r'[\U00010000-\U0010ffff]', flags=re.UNICODE)
    cleaned = emoji_pattern.sub('', cleaned)
    cleaned_lower = cleaned.lower()
    cleaned_spaces = re.sub(r'\s+', ' ', cleaned_lower).strip()
    
    raw_tokens = word_tokenize(cleaned_spaces)
    stop_words = set(stopwords.words('english'))
    lemmatizer = WordNetLemmatizer()
    
    cleaned_tokens = []
    for token in raw_tokens:
        t_clean = token.strip(string.punctuation)
        if t_clean and t_clean not in stop_words and not all(c in string.punctuation for c in t_clean):
            lemma = lemmatizer.lemmatize(t_clean)
            if lemma:
                cleaned_tokens.append(lemma)
                
    return {
        "cleaned_text": cleaned_spaces,
        "tokens": cleaned_tokens
    }

TOPIC_KEYWORDS = {
    "sleep": {"sleep", "insomnia", "tired", "rest", "fatigue", "exhausted", "bed", "dream", "awake", "night"},
    "work": {"work", "job", "office", "boss", "colleague", "meeting", "task", "project", "deadline", "career", "presentation", "deadlines"},
    "study": {"study", "learn", "class", "lecture", "homework", "school", "university", "college", "exam", "test", "quiz", "grade", "midterm", "final", "cramming", "prepare", "exams"},
    "relationship": {"relationship", "partner", "spouse", "love", "divorce", "dating", "argument", "fight", "heartbreak"},
    "family": {"family", "mother", "father", "mom", "dad", "parent", "sibling", "brother", "sister", "child", "son", "daughter", "mother", "grandmother", "grandfather"},
    "finance": {"finance", "money", "bill", "cost", "salary", "spend", "debt", "budget", "broke", "expensive"},
    "health": {"health", "sick", "doctor", "medicine", "pain", "injury", "illness", "clinical", "hospital"},
    "friends": {"friend", "friends", "buddy", "meetup", "hangout", "social", "party", "gathering"},
    "career": {"career", "promotion", "resume", "interview", "hire", "unemployed", "salary"},
    "exercise": {"exercise", "workout", "gym", "run", "running", "walk", "jog", "jogging", "lift", "fitness", "yoga", "play", "playing", "badminton", "sport", "sports"},
    "food": {"food", "eat", "meal", "dinner", "lunch", "breakfast", "diet", "nutrition", "hungry"},
    "hydration": {"hydration", "water", "drink", "dehydrated", "hydrated", "glass", "liquid"}
}

def split_into_clauses(sentence_text):
    delimiters = r'\b(?:but|yet|however|although|though|and|or)\b|[,;]'
    clauses = re.split(delimiters, sentence_text, flags=re.IGNORECASE)
    return [c.strip() for c in clauses if c.strip()]

def analyze_sentence_nlp(sentence_text, lemmatizer):
    sentence_text_lower = sentence_text.lower()
    clauses = split_into_clauses(sentence_text_lower)
    all_matches = []
    word_offset = 0
    
    for clause in clauses:
        clause_raw_words = word_tokenize(clause)
        clause_words = [w.strip(string.punctuation) for w in clause_raw_words if w.strip(string.punctuation)]
        if not clause_words:
            continue
            
        has_past = any(w in PAST_INDICATORS for w in clause_words) or "used to" in clause
        has_future = any(w in FUTURE_INDICATORS for w in clause_words) or any(phrase in clause for phrase in ["going to", "plan to", "hope to"])
        clause_tense = "past" if (has_past and not has_future) else ("future" if has_future else "present")
        
        for idx, word in enumerate(clause_words):
            lemma = lemmatizer.lemmatize(word)
            matched_emo = None
            for emo, kws in EMOTION_KEYWORDS.items():
                if lemma in kws or word in kws:
                    matched_emo = emo
                    break
            
            if matched_emo:
                is_negated = False
                for prev_idx in range(idx - 1, -1, -1):
                    prev = clause_words[prev_idx]
                    if prev in NEGATION_WORDS:
                        is_negated = True
                        break
                if idx >= 1 and clause_words[idx - 1] == "longer" and idx >= 2 and clause_words[idx - 2] == "no":
                    is_negated = True
                if "no longer" in clause or "not anymore" in clause:
                    is_negated = True
                    
                all_matches.append({
                    "emotion": matched_emo,
                    "is_negated": is_negated,
                    "tense": clause_tense,
                    "index": word_offset + idx
                })
        
        word_offset += len(clause_words)
        
    best_match = None
    if all_matches:
        def match_key(m):
            tense_val = 3 if m["tense"] == "present" else (2 if m["tense"] == "future" else 1)
            return (tense_val, m["index"])
        sorted_matches = sorted(all_matches, key=match_key, reverse=True)
        best_match = sorted_matches[0]
        
    raw_emo = None
    is_negated = False
    tense = "present"
    
    if not best_match:
        sentence_raw_words = word_tokenize(sentence_text_lower)
        sentence_words = [w.strip(string.punctuation) for w in sentence_raw_words if w.strip(string.punctuation)]
        has_past = any(w in PAST_INDICATORS for w in sentence_words) or "used to" in sentence_text_lower
        has_future = any(w in FUTURE_INDICATORS for w in sentence_words) or any(phrase in sentence_text_lower for phrase in ["going to", "plan to", "hope to"])
        tense = "past" if (has_past and not has_future) else ("future" if has_future else "present")
    else:
        raw_emo = best_match["emotion"]
        is_negated = best_match["is_negated"]
        tense = best_match["tense"]
        
    interpreted_emo = None
    if raw_emo:
        if is_negated:
            interpreted_emo = NEGATION_EMOTION_MAP.get(raw_emo, raw_emo)
        else:
            interpreted_emo = raw_emo
            
    topics = []
    sentence_raw_words = word_tokenize(sentence_text_lower)
    sentence_words = [w.strip(string.punctuation) for w in sentence_raw_words if w.strip(string.punctuation)]
    for topic, kws in TOPIC_KEYWORDS.items():
        if any(w in kws or lemmatizer.lemmatize(w) in kws for w in sentence_words) or any(kw in sentence_text_lower for kw in kws):
            topics.append(topic)
            
    recovery_detected = False
    for r_phrase in RECOVERY_PHRASES:
        if r_phrase in sentence_text_lower:
            recovery_detected = True
            break
            
    negative_emotions = {"Sad", "Angry", "Fear", "Anxiety", "Stress", "Frustrated", "Lonely", "Overwhelmed", "Emotionally exhausted"}
    
    if recovery_detected or (raw_emo in negative_emotions and is_negated):
        status = "recovery"
    elif interpreted_emo in negative_emotions and tense == "present":
        status = "distress"
    else:
        status = "neutral"
        
    sia = SentimentIntensityAnalyzer()
    compound_vader = sia.polarity_scores(sentence_text)["compound"]
    
    sentiment = "Neutral"
    positive_emos = {"Happy", "Calm", "Relaxed", "Hopeful", "Excited", "Confident", "Grateful", "Motivated", "Connected"}
    if interpreted_emo in positive_emos:
        sentiment = "Positive"
    elif interpreted_emo in negative_emotions:
        sentiment = "Negative"
    else:
        if status == "recovery":
            sentiment = "Positive"
        else:
            positive_phrases = ["visit", "jog", "play", "run", "walk", "friend", "family", "mother", "father", "mom", "dad", "sibling", "grand"]
            negative_indicators = ["couldn't", "could not", "can't", "cannot", "unable", "fail", "failed", "difficult", "hard", "problem", "miss", "lost", "bad"]
            if any(phrase in sentence_text_lower for phrase in positive_phrases) and not any(neg in sentence_text_lower for neg in negative_indicators):
                sentiment = "Positive"
            elif compound_vader >= 0.05:
                sentiment = "Positive"
            elif compound_vader <= -0.05:
                sentiment = "Negative"
                
    stress_sources = []
    strain_indicators = ["deadline", "deadlines", "overload", "pressure", "burnout", "exhaust", "exhausted", "struggle", "struggling", "strain", "difficult", "hard", "couldn't", "could not"]
    if sentiment == "Negative" or status == "distress" or any(w in sentence_text_lower for w in strain_indicators):
        for t in topics:
            stress_sources.append(t)
            
    return {
        "text": sentence_text.strip(),
        "emotion": interpreted_emo,
        "is_negated": is_negated,
        "tense": tense,
        "status": status,
        "topics": topics,
        "sentiment": sentiment,
        "stress_sources": stress_sources
    }

def aggregate_overall_state(sentences_analysis, compound_vader):
    total_emotions = {emo: 0.0 for emo in EMOTION_KEYWORDS}
    
    for sent in sentences_analysis:
        emo = sent["emotion"]
        weight = 1.0 if sent["tense"] == "present" else 0.2
        
        if sent["status"] == "recovery":
            total_emotions["Calm"] += 1.0 * weight
            total_emotions["Hopeful"] += 0.5 * weight
            if emo and emo not in {"Sad", "Angry", "Fear", "Anxiety", "Stress", "Frustrated", "Lonely", "Overwhelmed", "Emotionally exhausted"}:
                total_emotions[emo] += 1.0 * weight
            continue
            
        if emo:
            total_emotions[emo] += 1.0 * weight
                     
    sorted_emos = sorted(total_emotions.items(), key=lambda x: x[1], reverse=True)
    top_emo, top_val = sorted_emos[0]
    sec_emo, sec_val = sorted_emos[1]
    
    positive_emos = {"Happy", "Calm", "Relaxed", "Hopeful", "Excited", "Confident", "Grateful", "Motivated", "Connected"}
    negative_emos = {"Sad", "Angry", "Fear", "Anxiety", "Stress", "Frustrated", "Lonely", "Overwhelmed", "Emotionally exhausted"}
    
    pos_score = sum(total_emotions[emo] for emo in positive_emos)
    neg_score = sum(total_emotions[emo] for emo in negative_emos)
    
    if pos_score > neg_score:
        sentiment = "Positive"
    elif neg_score > pos_score:
        sentiment = "Negative"
    else:
        if compound_vader >= 0.05:
            sentiment = "Positive"
        elif compound_vader <= -0.05:
            sentiment = "Negative"
        else:
            sentiment = "Neutral"
            
    if top_val == 0.0:
        if sentiment == "Positive":
            primary = "Calm"
            secondary = "Hopeful"
        elif sentiment == "Negative":
            primary = "Sad"
            secondary = "Anxiety"
        else:
            primary = "Calm"
            secondary = "Hopeful"
    else:
        primary = top_emo
        if sec_val > 0.0:
            secondary = sec_emo
        else:
            if sentiment == "Positive" and primary != "Happy":
                secondary = "Happy"
            elif sentiment == "Negative" and primary != "Sad":
                secondary = "Sad"
            else:
                secondary = "Calm" if primary != "Calm" else "Hopeful"
                
    if primary == secondary:
        secondary = "Hopeful" if primary != "Hopeful" else "Calm"
        
    total_val = sum(total_emotions.values())
    if total_val > 0.0:
        confidence = (top_val / total_val) * 0.7 + 0.3
    else:
        confidence = 0.8
        
    return {
        "sentiment": sentiment,
        "primary_emotion": primary,
        "secondary_emotion": secondary,
        "confidence": round(confidence, 2)
    }

def analyze_text_nlp(text):
    if not text or not text.strip():
        return {
            "sentiment": "Neutral",
            "primary_emotion": "Calm",
            "secondary_emotion": "Hopeful",
            "confidence": 1.0,
            "sentences": []
        }
        
    raw_sentences = re.split(r'(?<=[.!?])\s+', text)
    lemmatizer = WordNetLemmatizer()
    
    sentences_analysis = []
    for raw_s in raw_sentences:
        stripped_s = raw_s.strip()
        if not stripped_s:
            continue
        s_res = analyze_sentence_nlp(stripped_s, lemmatizer)
        if s_res:
            sentences_analysis.append(s_res)
            
    sia = SentimentIntensityAnalyzer()
    compound_vader = sia.polarity_scores(text)["compound"]
    
    overall = aggregate_overall_state(sentences_analysis, compound_vader)
    
    return {
        "sentiment": overall["sentiment"],
        "primary_emotion": overall["primary_emotion"],
        "secondary_emotion": overall["secondary_emotion"],
        "confidence": overall["confidence"],
        "sentences": sentences_analysis
    }
