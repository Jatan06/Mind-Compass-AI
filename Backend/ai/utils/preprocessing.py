import re
import string
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

def preprocess_text(text):
    """
    Cleans raw journal text by lowercasing, removing HTML tags, URLs,
    emojis, redundant white space, punctuation, English stop-words, 
    and applying WordNet lemmatization.
    
    Returns:
        dict: A dictionary containing:
            - 'cleaned_text': the preprocessed clean string.
            - 'tokens': list of lemmatized, non-stopword word tokens.
    """
    if not text:
        return {
            "cleaned_text": "",
            "tokens": []
        }
        
    # Remove HTML tags
    cleaned = re.sub(r'<[^>]*>', '', text)
    
    # Remove URLs
    cleaned = re.sub(r'https?://\S+|www\.\S+', '', cleaned)
    
    # Remove Emojis (optional but implemented using unicode range filters)
    emoji_pattern = re.compile(r'[\U00010000-\U0010ffff]', flags=re.UNICODE)
    cleaned = emoji_pattern.sub('', cleaned)
    
    # Lowercase
    cleaned_lower = cleaned.lower()
    
    # Remove extra spaces
    cleaned_spaces = re.sub(r'\s+', ' ', cleaned_lower).strip()
    
    # Tokenize
    raw_tokens = word_tokenize(cleaned_spaces)
    
    # Stop-word removal and punctuation removal
    stop_words = set(stopwords.words('english'))
    lemmatizer = WordNetLemmatizer()
    
    cleaned_tokens = []
    for token in raw_tokens:
        # Strip trailing/leading punctuation symbols from token
        t_clean = token.strip(string.punctuation)
        # Exclude pure punctuation tokens and stop-words
        if t_clean and t_clean not in stop_words and not all(c in string.punctuation for c in t_clean):
            lemma = lemmatizer.lemmatize(t_clean)
            if lemma:
                cleaned_tokens.append(lemma)
                
    return {
        "cleaned_text": cleaned_spaces,
        "tokens": cleaned_tokens
    }
