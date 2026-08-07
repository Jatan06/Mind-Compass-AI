from django.apps import AppConfig

class AiConfig(AppConfig):
    name = 'ai'

    def ready(self):
        try:
            import nltk
            resources = ['punkt', 'punkt_tab', 'stopwords', 'wordnet', 'vader_lexicon']
            for res in resources:
                try:
                    nltk.download(res, quiet=True)
                except Exception:
                    pass
        except ImportError:
            pass


