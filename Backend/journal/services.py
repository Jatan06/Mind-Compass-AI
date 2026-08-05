from .models import JournalEntry
from ai.sentiment.services import SentimentAnalysisService
from ai.emotions.services import EmotionDetectionService
from ai.keywords.services import KeywordExtractionService
from ai.crisis.services import CrisisDetectionService
from ai.models import EmotionAnalysis

class JournalService:
    @staticmethod
    def list_entries(user):
        return JournalEntry.objects.filter(user=user)

    @staticmethod
    def get_entry(user, entry_id):
        try:
            return JournalEntry.objects.get(user=user, id=entry_id)
        except JournalEntry.DoesNotExist:
            return None

    @classmethod
    def _run_nlp_pipeline(cls, entry):
        """
        Executes text cleaning, VADER Sentiment analysis, Emotion mapping,
        Keywords, and Crisis indicators detection on a journal entry. 
        Stores analysis results to entry.analysis and adds an EmotionAnalysis record.
        """
        text = entry.text
        
        # 1. Run Sentiment analyze
        sent_res = SentimentAnalysisService.analyze(text)
        
        # 2. Run Emotion detect
        em_res = EmotionDetectionService.detect(text)
        
        # 3. Run Keywords extract
        kw_res = KeywordExtractionService.extract(text)

        # 4. Run Crisis detection
        crisis_res = CrisisDetectionService.detect(text, user=entry.user, journal_entry=entry)
        
        # Get raw sentences from analyze_text_nlp to save
        from ai.utils.preprocessing import analyze_text_nlp
        nlp_res = analyze_text_nlp(text)
        
        # Save structured analysis in journal entry format
        entry.analysis = {
            "sentiment": sent_res["sentiment"],
            "emotion": em_res["primary_emotion"],
            "secondary_emotion": em_res["secondary_emotion"],
            "confidence": em_res["confidence"],
            "themes": kw_res["topics"],
            "crisisStatus": crisis_res["risk_level"],
            "sentences": nlp_res["sentences"]
        }
        entry.save()
        
        # Store in database table: EmotionAnalysis
        EmotionAnalysis.objects.create(
            journal_entry=entry,
            primary_emotion=em_res["primary_emotion"],
            secondary_emotion=em_res["secondary_emotion"],
            confidence=em_res["confidence"]
        )

    @classmethod
    def create_entry(cls, user, text, is_voice=False):
        entry = JournalEntry.objects.create(
            user=user,
            text=text,
            is_voice=is_voice,
            analysis={}
        )
        # Execute NLP pipeline and save analysis & EmotionAnalysis database target
        cls._run_nlp_pipeline(entry)
        return entry

    @classmethod
    def update_entry(cls, user, entry_id, text, is_voice=None):
        entry = cls.get_entry(user, entry_id)
        if not entry:
            return None
            
        # Avoid duplicate analyses for unchanged journals
        if entry.text == text:
            if is_voice is not None and entry.is_voice != is_voice:
                entry.is_voice = is_voice
                entry.save()
            return entry

        entry.text = text
        if is_voice is not None:
            entry.is_voice = is_voice
        entry.save()

        # Re-run live NLP pipeline since text content was modified
        cls._run_nlp_pipeline(entry)
        return entry

    @classmethod
    def delete_entry(cls, user, entry_id):
        entry = cls.get_entry(user, entry_id)
        if not entry:
            return False
        entry.delete()
        return True
