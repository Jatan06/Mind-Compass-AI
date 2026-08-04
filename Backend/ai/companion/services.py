import os
import logging
from django.utils import timezone
from django.conf import settings

logger = logging.getLogger(__name__)


class CompanionService:
    """
    Gemini-powered AI Companion (Compass) for Mind Compass.
    Builds a compact, token-efficient system prompt from user profile data.
    """

    COMPANION_NAME = "Compass"
    MODEL_NAME = "gemini-2.0-flash-lite"   # Lighter model — higher free RPM & RPD
    GROQ_MODEL_NAME = "llama-3.3-70b-versatile"

    # ------------------------------------------------------------------ #
    #  Compact Context Builder  (target: <400 tokens for system prompt)    #
    # ------------------------------------------------------------------ #

    @classmethod
    def _build_system_prompt(cls, user) -> str:
        from mood.models import MoodLog
        from journal.models import JournalEntry
        from ai.models import AIInsight

        today = timezone.localdate()
        past_30 = today - timezone.timedelta(days=30)

        name = user.first_name or user.username

        # --- Mood summary (30 days) ---
        mood_logs = list(MoodLog.objects.filter(user=user, date__gte=past_30).order_by('-date')[:10])
        n = len(mood_logs)
        if n:
            avg_mood   = round(sum(m.mood for m in mood_logs) / n, 1)
            avg_stress = round(sum(m.stress for m in mood_logs) / n, 1)
            avg_sleep  = round(sum(float(m.sleep or 7) for m in mood_logs) / n, 1)
            trend = "stable"
            if n >= 2:
                d = mood_logs[0].mood - mood_logs[-1].mood
                trend = "improving" if d > 0.3 else ("declining" if d < -0.3 else "stable")
            mood_line = f"Mood {avg_mood}/5, Stress {avg_stress}/10, Sleep {avg_sleep}h, trend: {trend}"
        else:
            mood_line = "No mood data yet"

        # --- Journal themes ---
        journals = list(JournalEntry.objects.filter(
            user=user, created_at__date__gte=past_30
        ).order_by('-created_at')[:3])

        theme_freq: dict[str, int] = {}
        for j in journals:
            if j.analysis:
                for t in j.analysis.get("themes", []):
                    theme_freq[t] = theme_freq.get(t, 0) + 1
        top_themes = ", ".join(t for t, _ in sorted(theme_freq.items(), key=lambda x: x[1], reverse=True)[:3])

        # Latest journal snippet
        latest_journal = ""
        if journals:
            latest_journal = journals[0].text[:80]

        # --- Latest AI insight ---
        insight = AIInsight.objects.filter(user=user).order_by('-created_at').first()
        insight_line = insight.summary[:120] if insight else "None yet"

        # --- Profile ---
        try:
            p = user.profile
            occupation = getattr(p, 'occupation', '') or ''
            goals = ", ".join(getattr(p, 'goals', []) or [])
            triggers = ", ".join(getattr(p, 'triggers', []) or [])
        except Exception:
            occupation = goals = triggers = ''

        # Build compact prompt
        prompt = (
            f"You are Compass, a warm empathetic AI mental-health companion inside Mind Compass app.\n"
            f"User: {name}"
            + (f" ({occupation})" if occupation else "")
            + f"\n"
            f"30-day stats: {mood_line}\n"
            f"Journal themes: {top_themes or 'none yet'}\n"
            f"Latest journal: \"{latest_journal}\"\n"
            f"AI insight: {insight_line}\n"
            + (f"Goals: {goals}\n" if goals else "")
            + (f"Triggers: {triggers}\n" if triggers else "")
            + f"\n"
            f"Rules:\n"
            f"- Be warm, personal, conversational — NOT clinical bullet points\n"
            f"- Use {name}'s first name naturally\n"
            f"- Ground responses in their actual data above\n"
            f"- Keep replies to 2-3 short paragraphs max\n"
            f"- Never diagnose; encourage professional help for serious concerns\n"
            f"- If crisis/self-harm detected, respond with urgent compassion and suggest helplines\n"
            f"- End with a gentle open question to keep the conversation flowing\n"
            f"Today: {today}"
        )
        return prompt

    GROQ_MODEL_NAME = "llama-3.3-70b-versatile"

    # ------------------------------------------------------------------ #
    #  Chat                                                                 #
    # ------------------------------------------------------------------ #

    @classmethod
    def chat(cls, user, message: str, history: list[dict]) -> dict:
        """
        Send a message to Gemini or Groq with compact user context.
        Returns {"response": str, "model": str} — never raises.
        """
        from dotenv import load_dotenv
        from pathlib import Path

        base_dir = Path(str(settings.BASE_DIR))
        load_dotenv(base_dir.parent / '.env', override=True)
        load_dotenv(base_dir / '.env', override=True)

        gemini_key = os.getenv('GEMINI_API_KEY', '') or getattr(settings, 'GEMINI_API_KEY', '')
        groq_key = os.getenv('GROQ_API_KEY', '') or getattr(settings, 'GROQ_API_KEY', '')

        # If Groq Key is present, use Groq (prioritizing it)
        if groq_key and groq_key != 'your-groq-api-key-here':
            try:
                from groq import Groq
                client = Groq(api_key=groq_key)
                system_prompt = cls._build_system_prompt(user)

                messages = [{"role": "system", "content": system_prompt}]
                for msg in history[-10:]:
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    role = "assistant" if role == "model" else role
                    messages.append({"role": role, "content": content})
                messages.append({"role": "user", "content": message})

                chat_completion = client.chat.completions.create(
                    messages=messages,
                    model=cls.GROQ_MODEL_NAME,
                    temperature=0.82,
                    max_tokens=512,
                )
                response_text = chat_completion.choices[0].message.content
                return {"response": response_text, "model": cls.GROQ_MODEL_NAME}

            except Exception as exc:
                err_str = str(exc)
                if "429" in err_str or "limit" in err_str.lower():
                    logger.warning(f"Groq quota/rate-limit hit for user {user.id}: {exc}")
                    return {
                        "response": (
                            "I'm a little overwhelmed with requests right now (Groq API rate limit reached). "
                            "Please wait a minute and try again — I'm not going anywhere! 💚"
                        ),
                        "model": "rate_limited"
                    }
                if "401" in err_str or "403" in err_str or "API_KEY" in err_str.upper():
                    logger.error(f"Groq auth error for user {user.id}: {exc}")
                    return {
                        "response": (
                            "I'm having trouble authenticating with the Groq service. "
                            "Please ask your admin to check the GROQ_API_KEY in .env. 🔑"
                        ),
                        "model": "auth_error"
                    }
                logger.error(f"CompanionService.chat Groq error for user {user.id}: {exc}", exc_info=True)
                return {
                    "response": "I ran into a small hiccup with the Groq service. Please try again in a moment. 💚",
                    "model": "error"
                }

        # Otherwise use Gemini
        if not gemini_key or gemini_key == 'your-gemini-api-key-here':
            return {
                "response": (
                    "I'm not fully set up yet — the admin needs to add a valid GEMINI_API_KEY "
                    "or GROQ_API_KEY to the .env file. 💚"
                ),
                "model": "unconfigured"
            }

        try:
            from google import genai
            from google.genai import types
            from google.genai.errors import ClientError

            client = genai.Client(api_key=gemini_key)
            system_prompt = cls._build_system_prompt(user)

            # Build contents list from trimmed history + current message
            contents = []
            for msg in history[-10:]:   # keep last 10 turns to save tokens
                role = msg.get("role", "user")
                content = msg.get("content", "")
                contents.append(types.Content(
                    role=role if role in ("user", "model") else "user",
                    parts=[types.Part(text=content)]
                ))

            contents.append(types.Content(
                role="user",
                parts=[types.Part(text=message)]
            ))

            response = client.models.generate_content(
                model=cls.MODEL_NAME,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.82,
                    max_output_tokens=512,   # concise replies = fewer tokens used
                )
            )

            return {"response": response.text, "model": cls.MODEL_NAME}

        except Exception as exc:
            err_str = str(exc)

            # Friendly rate-limit message
            if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                logger.warning(f"Gemini quota hit for user {user.id}: {exc}")
                return {
                    "response": (
                        "I'm a little overwhelmed with requests right now (API rate limit reached). "
                        "Please wait a minute and try again — I'm not going anywhere! 💚\n\n"
                        "If this keeps happening, your Gemini API free-tier quota may be exhausted for today. "
                        "Check your usage at ai.dev/rate-limit."
                    ),
                    "model": "rate_limited"
                }

            # Auth / key issues
            if "401" in err_str or "403" in err_str or "API_KEY" in err_str.upper():
                logger.error(f"Gemini auth error for user {user.id}: {exc}")
                return {
                    "response": (
                        "I'm having trouble authenticating with the AI service. "
                        "Please ask your admin to check the GEMINI_API_KEY in .env. 🔑"
                    ),
                    "model": "auth_error"
                }

            logger.error(f"CompanionService.chat error for user {user.id}: {exc}", exc_info=True)
            return {
                "response": (
                    "I ran into a small hiccup. Please try again in a moment — I'm here for you. 💚"
                ),
                "model": "error"
            }
