import nltk
from django.apps import AppConfig

class AiConfig(AppConfig):
    name = 'ai'

    def ready(self):
        resources = ['punkt', 'punkt_tab', 'stopwords', 'wordnet']
        for res in resources:
            try:
                nltk.download(res, quiet=True)
            except Exception:
                pass

