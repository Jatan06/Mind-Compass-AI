from core.models import CrisisAlert

class CrisisDetectionService:
    @classmethod
    def detect(cls, text, user=None, journal_entry=None):
        """
        Processes text and performs rule-based crisis indicators analysis.
        Generates risk score (0-100), targets self-harm/suicide ideation,
        hopelessness, worthlessness, isolation, and persistent despair.
        
        Persists warning/high risk alerts to CrisisAlert model.
        Returns:
            dict: {
                "risk_level": "Safe" | "Warning" | "High Risk",
                "reason": str (detailed diagnosis, explainability, guidance)
            }
        """
        if not text or not text.strip():
            return {
                "risk_level": "Safe",
                "reason": "Risk Score: 0/100. Indicators: None. Supportive Guidance: No text content was provided."
            }

        text_lower = text.lower()
        score = 0
        indicators = []

        # 1. Critical safety trigger list (Self-Harm / Suicide Ideation)
        suicide_words = ["suicide", "kill myself", "end it all", "end my life", "self-harm", "harm myself", "cutting", "want to die", "better off dead", "end my pain"]
        matched_suicide = [w for w in suicide_words if w in text_lower]
        if matched_suicide:
            score += 75
            indicators.append("Self-Harm / Suicide Ideation")

        # 2. Hopelessness key phrase scoring
        hopeless_words = ["hopeless", "despair", "cannot go on", "giving up", "no point", "pointless", "no future"]
        matched_hopeless = [w for w in hopeless_words if w in text_lower]
        if matched_hopeless:
            score += 35
            indicators.append("Hopelessness")

        # 3. Worthlessness triggers
        worthless_words = ["worthless", "useless", "failure", "good for nothing", "hate myself", "burden"]
        matched_worthless = [w for w in worthless_words if w in text_lower]
        if matched_worthless:
            score += 35
            indicators.append("Worthlessness")

        # 4. Isolation indicators
        isolation_words = ["isolated", "isolate", "alone", "nobody cares", "empty", "lonely", "abandoned"]
        matched_isolation = [w for w in isolation_words if w in text_lower]
        if matched_isolation:
            score += 35
            indicators.append("Isolation")

        # 5. Severe emotional distress and anxiety indicators
        despair_words = ["always", "never gets better", "forever", "endless dark", "screaming", "panic", "hate my life", "distress", "cannot breathe", "severe emotional distress", "anxious", "anxiety", "worried", "panic attack", "scared"]
        matched_despair = [w for w in despair_words if w in text_lower]
        if matched_despair:
            score += 35
            indicators.append("Severe Distress / Anxiety")

        # Cap overall score at 100
        score = min(100, score)

        # Risk Classification mapping
        if score >= 70:
            risk_level = "High Risk"
            guidance = "Your response indicates an urgent need for support. Please contact a professional, reach out to a trusted loved one, or call a local crisis line (like 988 in the US) immediately. You do not have to carry this alone."
        elif score >= 35:
            risk_level = "Warning"
            guidance = "It seems you are experiencing significant emotional distress. We highly recommend connecting with a mental health professional, therapist, or counselor to talk things through."
        else:
            risk_level = "Safe"
            guidance = "No clinical crisis indicators detected. Continue using your daily routing and reflection tools."

        # Consolidated explanation formatted reason string
        indicators_str = ", ".join(indicators) if indicators else "None"
        reason = f"Risk Score: {score}/100. Indicators: {indicators_str}. Supportive Guidance: {guidance}"

        # If user profile is active and risk is flagged, save to CrisisAlert
        if user and risk_level in ["High Risk", "Warning"]:
            alert_level = "Critical" if risk_level == "High Risk" else "Warning"
            CrisisAlert.objects.create(
                user=user,
                journal_entry=journal_entry,
                alert_level=alert_level,
                status="Active",
                trigger_message=f"Risk Score: {score}. Decided indicators: {indicators_str}. Excerpt: {text[:150]}"
            )

        return {
            "risk_level": risk_level,
            "reason": reason
        }
