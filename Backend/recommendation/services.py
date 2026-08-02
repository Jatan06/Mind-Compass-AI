from django.utils import timezone
from django.db import models
from .models import Recommendation
from activities.models import TherapyActivity, ActivityFeedback
from mood.models import MoodLog
from assessment.models import AssessmentResponse
from journal.models import JournalEntry

class RecommendationService:
    @classmethod
    def get_today_recommendation(cls, user, force_recalculate=False):
        today = timezone.localdate()

        # Check if today's mood check-in and journal entry exist
        mood_log_exists = MoodLog.objects.filter(user=user, date=today).exists()
        journal_exists = JournalEntry.objects.filter(user=user, created_at__date=today).exists()
        if not (mood_log_exists and journal_exists):
            return None
        
        # Deactivate recommendations from prior days to ensure a fresh, active daily recommendation
        Recommendation.objects.filter(user=user, is_active=True, created_at__date__lt=today).update(is_active=False)
        
        if force_recalculate:
            Recommendation.objects.filter(user=user, created_at__date=today, is_active=True).update(is_active=False)
        else:
            # Get active recommendation for today if it exists
            rec = Recommendation.objects.filter(user=user, created_at__date=today, is_active=True).exclude(rec_type='quick').first()
            if rec:
                return rec
            
            # Deactivate any active quick recommendation since we are upgrading to complete
            Recommendation.objects.filter(user=user, created_at__date=today, is_active=True, rec_type='quick').update(is_active=False)

        return cls._generate_recommendation_logic(user, is_quick=False)

    @classmethod
    def _generate_recommendation_logic(cls, user, is_quick=False):
        today = timezone.localdate()

        # Get current states
        mood_log = MoodLog.objects.filter(user=user, date=today).first()
        if not mood_log:
            # Fall back to the most recent log of the last 3 days
            mood_log = MoodLog.objects.filter(user=user, date__gte=today - timezone.timedelta(days=3)).order_by('-date').first()
            
        assessment = AssessmentResponse.objects.filter(user=user).order_by('-created_at').first()
        goals = []
        if assessment and assessment.raw_data:
            goals = [g.lower() for g in assessment.raw_data.get('goals', [])]

        if is_quick:
            journal_entry = None
            journal_themes = []
            today_text = ""
            today_matched_keywords = []
            similar_journals_count = 0
            recent_primary_emotions = []
        else:
            # Retrieve themes and text from today's journal entry
            journal_entry = JournalEntry.objects.filter(user=user, created_at__date=today).first()
            journal_themes = []
            today_text = ""
            if journal_entry:
                today_text = (journal_entry.text or "").lower()
                if journal_entry.analysis:
                    journal_themes = [t.lower() for t in journal_entry.analysis.get("themes", [])]

            # Define keywords for theme matching (Module 1)
            matching_keywords = ["exam", "study", "assignments", "placement", "deadlines", "work", "relationship", "family", "sleep", "stress", "anxiety"]
            today_matched_keywords = [kw for kw in matching_keywords if kw in today_text]

            # Search previous journals for similar themes in past 30 days
            past_journals = JournalEntry.objects.filter(
                user=user,
                created_at__date__gte=today - timezone.timedelta(days=30)
            )
            if journal_entry:
                past_journals = past_journals.exclude(pk=journal_entry.pk)

            similar_journals_count = 0
            for pj in past_journals:
                pj_text = (pj.text or "").lower()
                pj_themes = []
                if pj.analysis:
                    pj_themes = [t.lower() for t in pj.analysis.get("themes", [])]
                
                has_theme_overlap = any(t in pj_themes for t in journal_themes) if journal_themes else False
                has_keyword_overlap = any(kw in pj_text for kw in today_matched_keywords) if today_matched_keywords else False
                
                if has_theme_overlap or has_keyword_overlap:
                    similar_journals_count += 1

            # Search EmotionAnalysis (Module 4 request)
            from ai.models import EmotionAnalysis
            recent_emotions_qs = EmotionAnalysis.objects.filter(
                journal_entry__user=user,
                created_at__date__gte=today - timezone.timedelta(days=30)
            )
            recent_primary_emotions = [ea.primary_emotion.lower() for ea in recent_emotions_qs]

        # Gather activity feedback metrics for this user
        feedbacks = ActivityFeedback.objects.filter(user=user)
        activity_fb_map = {}
        for fb in feedbacks:
            act_id = fb.activity_id
            if act_id not in activity_fb_map:
                activity_fb_map[act_id] = []
            activity_fb_map[act_id].append(fb)

        # Calculate scores for all activities in database
        activities = list(TherapyActivity.objects.all())
        if not activities:
            return None

        # Check Case A: User has positive mood, positive journal, low stress, good sleep, stable energy
        is_case_a = False
        if not is_quick and mood_log:
            val_sleep = float(mood_log.sleep or 7.0)
            is_journal_positive_or_neutral = True
            if journal_entry and journal_entry.analysis:
                sent = journal_entry.analysis.get("sentiment", "Neutral")
                themes = [t.lower() for t in journal_entry.analysis.get("themes", [])]
                has_negative_themes = any(t in ["loneliness", "lonely", "sad", "sadness", "stress", "anxiety", "depression", "overwhelmed"] for t in themes)
                if sent == "Negative" or has_negative_themes:
                    is_journal_positive_or_neutral = False
            elif journal_entry:
                is_journal_positive_or_neutral = False

            if (mood_log.mood >= 4 and 
                mood_log.stress <= 3 and 
                val_sleep >= 7.0 and 
                mood_log.energy >= 3 and 
                is_journal_positive_or_neutral):
                is_case_a = True

        if is_case_a:
            wellness_ids = ['act-17', 'act-10', 'act-25', 'act-8', 'act-6', 'act-18', 'act-19', 'act-26', 'act-37', 'act-11', 'act-5']
            activities = [act for act in activities if act.id in wellness_ids]

        # Mixed signals detection
        mixed_signal_observation = None
        if not is_quick and mood_log and journal_entry:
            mood_is_positive = mood_log.mood >= 4
            mood_is_negative = mood_log.mood <= 2
            
            journal_sent = journal_entry.analysis.get("sentiment", "Neutral")
            journal_is_negative = (journal_sent == "Negative")
            journal_is_positive = (journal_sent == "Positive")
            
            journal_themes_lower = [t.lower() for t in journal_themes]
            has_lonely = "lonely" in journal_themes_lower or "loneliness" in journal_themes_lower or (today_text and any(w in today_text.lower() for w in ["alone", "lonely", "loneliness"]))
            has_stress = any(t in ["exam", "study", "work", "pressure", "academic", "job", "stress", "anxiety"] for t in journal_themes_lower)
            
            if mood_is_positive and (journal_is_negative or has_lonely or has_stress):
                if has_lonely:
                    mixed_signal_observation = "Your mood check-in was generally positive, but today's journal suggests feelings of loneliness."
                elif has_stress:
                    mixed_signal_observation = "Your mood check-in was generally positive, but today's journal suggests some stress indicators."
                else:
                    mixed_signal_observation = "Your mood check-in was positive, but today's journal indicates a more challenging emotional state."
            elif mood_is_negative and journal_is_positive:
                mixed_signal_observation = "Your mood check-in was low, but today's journal reflects a positive or hopeful perspective."

        # Base clinical targets (rules match fallback expectations)
        target_override_id = None
        target_reason = "A mindful breathing slot to reset your core focus."

        if mood_log:
            stress = mood_log.stress
            sleep = float(mood_log.sleep) if mood_log.sleep else 7.0
            energy = mood_log.energy
            mood = mood_log.mood
            notes = (mood_log.notes or "").lower()

            if stress >= 7:
                target_override_id = 'act-1'
                target_reason = "Suggested because your stress level today is high. Box breathing promotes immediate physiological calm."
            elif energy <= 3:
                target_override_id = 'act-37'
                target_reason = "Suggested because your energy levels are low. A somatic release helps discharge physical fatigue."
            elif sleep < 6.0:
                target_override_id = 'act-15'
                target_reason = "Suggested because you logged less than 6 hours of sleep. A sleep protocol helps optimize rest quality."
            elif mood <= 2 or "worry" in notes or "anxious" in notes or "stuck" in notes:
                target_override_id = 'act-33'
                target_reason = "Suggested because you are feeling down or anxious. The 5-4-3-2-1 grounding technique breaks cycles of overthinking."
            elif mood >= 4:
                target_override_id = 'act-17'
                target_reason = "Suggested because your mood is excellent. Practicing gratitude amplifies current positive emotions."

        # If no acute mood override, fall back to assessment goals
        if not target_override_id and goals:
            if any(word in g for g in goals for word in ["sleep", "insomnia", "rest"]):
                target_override_id = 'act-16'
                target_reason = "Recommended based on your goal to improve sleep quality."
            elif any(word in g for g in goals for word in ["stress", "anxiety", "calm"]):
                target_override_id = 'act-31'
                target_reason = "Recommended based on your goal to reduce stress and anxiety."
            elif any(word in g for g in goals for word in ["focus", "productivity", "energ"]):
                target_override_id = 'act-28'
                target_reason = "Recommended to support your focus and energy goals."

        if not target_override_id:
            target_override_id = 'act-12'
            target_reason = "A mindful breathing slot to reset your core focus."

        activity_scores = {}
        reasons_map = {}

        def val_fmt(val):
            return int(val) if isinstance(val, (int, float)) and val == int(val) else round(val, 2)

        for act in activities:
            # 1. Current Mood / State (30%)
            current_mood_score = 10.0
            mood_reasons = []
            
            if act.id == target_override_id:
                current_mood_score = 30.0
                mood_reasons.append(target_reason)
            else:
                category_lower = act.category.lower()
                title_lower = act.title.lower()
                if mood_log:
                    stress = mood_log.stress
                    sleep = float(mood_log.sleep) if mood_log.sleep else 7.0
                    if stress >= 5 and ("breathing" in category_lower or "somatic" in category_lower):
                        current_mood_score = 22.0
                        mood_reasons.append("Matches your elevated stress pattern today.")
                    elif sleep < 7.0 and "sleep" in title_lower:
                        current_mood_score = 22.0
                        mood_reasons.append("Aligned with your sleep pattern metrics.")
                elif goals:
                    if any("sleep" in g for g in goals) and ("sleep" in title_lower or "sleep" in category_lower):
                        current_mood_score = 25.0
                        mood_reasons.append("Supports your target goals to improve sleep.")
                    elif any("stress" in g or "anxi" in g for g in goals) and ("breathing" in category_lower or "somatic" in category_lower):
                        current_mood_score = 25.0
                        mood_reasons.append("Encouraged to support stress reduction goals.")

            # 2. Themes & Category tags similarity (25%)
            theme_score = 5.0
            theme_reasons = []
            category_lower = act.category.lower()
            title_lower = act.title.lower()
            desc_lower = act.description.lower()
            
            matched_themes_activity = []
            for theme in journal_themes:
                if theme in category_lower or theme in title_lower or theme in desc_lower:
                    matched_themes_activity.append(theme)
            for kw in today_matched_keywords:
                if kw in ["exam", "study", "assignments", "placement", "deadlines"] and act.id in ["act-1", "act-2", "act-8", "act-12"]:
                    matched_themes_activity.append(kw)
                if kw in ["work", "deadlines"] and act.id in ["act-25", "act-26", "act-35", "act-36"]:
                    matched_themes_activity.append(kw)
                if kw in ["sleep"] and act.id in ["act-14", "act-15", "act-16"]:
                    matched_themes_activity.append(kw)
                if kw in ["relationship", "family"] and act.id in ["act-6", "act-18", "act-49", "act-50"]:
                    matched_themes_activity.append(kw)

            # Check EmotionAnalysis (Module 4 request)
            has_matching_emotion = False
            for emotion in recent_primary_emotions:
                if emotion in ["sad", "lonely", "grief"] and ("gratitude" in category_lower or "relaxation" in category_lower):
                    has_matching_emotion = True
                elif emotion in ["anxiety", "stress", "fear", "overwhelmed", "frustrated"] and ("breathing" in category_lower or "grounding" in category_lower or "somatic" in category_lower):
                    has_matching_emotion = True
            
            if has_matching_emotion:
                theme_score = 25.0
                theme_reasons.append(f"Recent emotion analysis detected patterns of negative emotions like {', '.join(sorted(list(set(recent_primary_emotions))))}.")

            # 3. Learning feedback loops & Historical Success (20%)
            success_score = 10.0
            success_reasons = []
            past_completed = Recommendation.objects.filter(user=user, activity=act, completed=True)
            avg_impr = None
            if past_completed.exists():
                avg_impr = past_completed.aggregate(models.Avg('improvement_score'))['improvement_score__avg']
                if avg_impr is not None:
                    if avg_impr >= 1.5:
                        success_score = 20.0
                    elif avg_impr >= 0.5:
                        success_score = 15.0

            # 4. User feedback satisfaction rating (15%)
            fbs = activity_fb_map.get(act.id, [])
            feedback_score = 10.0
            feedback_reasons = []
            avg_satisfaction = None
            if fbs:
                total_satisfaction = sum(f.satisfaction for f in fbs)
                avg_satisfaction = total_satisfaction / len(fbs)
                feedback_score = (avg_satisfaction / 5.0) * 15.0

            # Compiling unified historical description if possible
            if matched_themes_activity:
                theme_score = 25.0
                if similar_journals_count > 0:
                    if avg_satisfaction is not None:
                        theme_reasons.append(
                            f"Similar {matched_themes_activity[0]}-related stress was detected {similar_journals_count} times previously. "
                            f"{act.title} helped reduce your stress and was rated {int(avg_satisfaction)}/5, so it is recommended again."
                        )
                    else:
                        theme_reasons.append(f"Similar {matched_themes_activity[0]}-related stress was detected {similar_journals_count} times previously.")
                else:
                    theme_reasons.append(f"Your journal indicates {matched_themes_activity[0]}-related stress.")
            
            if avg_impr is not None:
                if avg_impr >= 1.5:
                    success_reasons.append(f"{act.title} previously reduced your average stress level.")
                elif avg_impr >= 0.5:
                    success_reasons.append(f"{act.title} showed moderate mood benefit previously.")

            if avg_satisfaction is not None and not (matched_themes_activity and similar_journals_count > 0):
                feedback_reasons.append(f"You completed this activity successfully and rated it {int(avg_satisfaction)}/5.")

            # 5. Recommendation Diversity (10%)
            diversity_score = 10.0
            total_penalty = 0.0
            
            if fbs:
                latest_fb = sorted(fbs, key=lambda f: f.created_at, reverse=True)[0]
                days_ago = (today - latest_fb.created_at.date()).days
                if days_ago < 2:
                    diversity_score = 0.0
                    total_penalty = 35.0  # Completed very recently
                elif days_ago < 5:
                    diversity_score = 5.0
                    total_penalty = 15.0  # Completed within the last few days
            
            # Penalty for repeatedly recommended but ignored in last 3 days
            ignored_recs = Recommendation.objects.filter(
                user=user,
                activity=act,
                completed=False,
                created_at__date__gte=today - timezone.timedelta(days=3)
            )
            if ignored_recs.exists():
                total_penalty += 20.0

            # Calculate total weighted score
            total_score = current_mood_score + theme_score + success_score + feedback_score + diversity_score - total_penalty
            total_score = max(1.0, total_score)
            
            activity_scores[act] = total_score

            
            # Combine point explanations
            all_reasons = []
            all_reasons.extend(mood_reasons)
            all_reasons.extend(theme_reasons)
            all_reasons.extend(success_reasons)
            all_reasons.extend(feedback_reasons)
            if not all_reasons:
                all_reasons.append(f"Recommended tool to support your goals and maintain emotional stability.")
            
            reasons_map[act] = all_reasons

        # Pick highest scoring activity
        sorted_acts = sorted(activity_scores.items(), key=lambda item: item[1], reverse=True)
        selected_act, top_score = sorted_acts[0]
        
        confidence_val = min(0.99, max(0.50, top_score / 100.0))
        
        # Save recommendation with deep history metadata
        rec_theme = ", ".join(journal_themes) if journal_themes else ""
        rec_trigger = today_text[:200] if today_text else ""

        # Activity success rate calculation
        total_p = Recommendation.objects.filter(user=user, activity=selected_act, created_at__date__lt=today).count()
        completed_p = Recommendation.objects.filter(user=user, activity=selected_act, completed=True, created_at__date__lt=today).count()
        if total_p > 0:
            rate_p = int((completed_p / total_p) * 100)
            success_rate_str = f"{rate_p}%"
        else:
            rate_p = None
            success_rate_str = None

        # Build explanation sentences dynamically based ONLY on factors that actually contributed
        theme_sentences = []
        emotion_sentences = []
        mood_sentences = []
        journal_sentences = []
        fit_sentences = []
        history_sentences = []
        success_sentences = []

        category_lower = selected_act.category.lower()
        title_lower = selected_act.title.lower()
        desc_lower = selected_act.description.lower()

        # Check theme/keyword activations for activity-specific context fits
        has_sleep_theme = any(t in ["sleep", "insomnia", "rest"] for t in journal_themes) or (mood_log and float(mood_log.sleep or 7.0) < 6.0)
        has_lonely_theme = any(t in ["lonely", "loneliness", "isolation"] for t in journal_themes) or (today_text and any(w in today_text.lower() for w in ["alone", "lonely", "loneliness"]))
        has_stress_theme = any(t in ["exam", "study", "work", "pressure", "academic", "job"] for t in journal_themes) or (mood_log and mood_log.stress >= 7)

        # 1. Today's detected themes (Highest priority)
        if not is_quick and journal_themes:
            for theme in journal_themes:
                theme_lower = theme.lower().strip()
                if "loneliness" in theme_lower or "lonely" in theme_lower:
                    theme_sentences.append("Today's journal indicates feelings of loneliness.")
                elif "exam" in theme_lower or "study" in theme_lower or "academic" in theme_lower or "pressure" in theme_lower:
                    theme_sentences.append("Today's journal indicates academic stress.")
                elif "work" in theme_lower or "job" in theme_lower or "career" in theme_lower:
                    theme_sentences.append("Today's journal indicates workplace stress.")
                elif "relationship" in theme_lower or "family" in theme_lower or "interpersonal" in theme_lower:
                    theme_sentences.append("Today's journal indicates relational stress.")
                elif "sleep" in theme_lower or "insomnia" in theme_lower or "rest" in theme_lower:
                    theme_sentences.append("Today's journal indicates sleep difficulties.")
                else:
                    theme_sentences.append(f"Today's journal indicates {theme_lower}-related concerns.")

        # 2. Today's detected emotions (Only if contributing / relevant)
        if not is_quick and journal_entry and journal_entry.analysis:
            today_emotion = journal_entry.analysis.get("emotion")
            if today_emotion:
                emo_lower = today_emotion.lower().strip()
                if emo_lower in ["anxiety", "stress", "fear", "overwhelmed", "frustrated"] and category_lower in ["breathing", "mindfulness", "grounding", "somatic", "stress management"]:
                    emotion_sentences.append(f"Emotion analysis detected feelings of {emo_lower} today.")
                elif emo_lower in ["sadness", "sad", "lonely", "loneliness", "grief"] and category_lower in ["gratitude", "mindfulness", "relaxation"]:
                    emotion_sentences.append(f"Emotion analysis highlighted feelings of {emo_lower} today.")

        # 3. Today's mood check-in values
        if mood_log:
            if selected_act.id == target_override_id:
                if mood_log.stress >= 7:
                    mood_sentences.append("Suggested because your stress level today is high.")
                elif mood_log.energy <= 3:
                    mood_sentences.append("Suggested because your energy levels are low.")
                elif float(mood_log.sleep or 7.0) < 6.0:
                    mood_sentences.append("Reduced sleep was detected during today's check-in.")
                elif mood_log.mood <= 2 or any(w in (mood_log.notes or "").lower() for w in ["worry", "anxious", "stuck"]):
                    mood_sentences.append("Suggested because you are feeling down or anxious.")
                elif mood_log.mood >= 4:
                    mood_sentences.append("Suggested because your mood is excellent.")
            else:
                if mood_log.stress >= 7:
                    mood_sentences.append("High stress levels were detected in today's check-in.")
                if float(mood_log.sleep or 7.0) < 6.0:
                    mood_sentences.append("Reduced sleep was detected during today's check-in.")
                if mood_log.energy <= 3:
                    mood_sentences.append("Low energy levels were noted in today's check-in.")
                if mood_log.mood <= 2:
                    mood_sentences.append("Low mood was detected in today's check-in.")
                elif mood_log.mood >= 4:
                    mood_sentences.append("Positive mood was highlighted in today's check-in.")

        # 4. Today's journal text keywords
        if not is_quick and today_text:
            text_lower = today_text.lower()
            if "exam" in text_lower and not any("academic" in s for s in theme_sentences):
                journal_sentences.append("Journal references upcoming academic deadlines.")
            elif "work" in text_lower and not any("workplace" in s for s in theme_sentences):
                journal_sentences.append("Journal mentions work-related stress factors.")
            elif "alone" in text_lower and not any("loneliness" in s for s in theme_sentences):
                journal_sentences.append("Journal text references feeling isolated or wanting to be alone.")
            elif "sleep" in text_lower and not any("sleep" in s for s in theme_sentences):
                journal_sentences.append("Journal references difficulty sleeping or wakefulness last night.")

        # 5. Activity-specific fit explanation
        act_id = selected_act.id
        if "cognitive shuffle" in title_lower or act_id == "act-13":
            fit_sentences.append("Cognitive Shuffle interrupts repetitive thoughts, reduces mental rumination, and prepares the mind for sleep.")
        elif act_id == "act-3" or "alternate nostril" in title_lower:
            if has_lonely_theme:
                fit_sentences.append("Alternate Nostril Breathing promotes calmness and emotional regulation during periods of isolation.")
            else:
                fit_sentences.append("Alternate Nostril Breathing promotes emotional balance, mental calmness, and nervous system regulation.")
        elif act_id == "act-1" or "box breathing" in title_lower:
            fit_sentences.append("Box Breathing helps regulate acute stress and anxiety.")
        elif act_id == "act-2" or "4-7-8" in title_lower:
            fit_sentences.append("4-7-8 Breathing supports relaxation and sleep preparation.")
        elif act_id == "act-10" or "mindful walk" in title_lower or act_id == "act-26":
            fit_sentences.append("Mindful Walking is useful during loneliness, emotional fatigue, and mental overload.")
        elif act_id == "act-12" or "breathing space" in title_lower:
            fit_sentences.append("A brief breathing space halts automatic stress reactions.")
        elif act_id == "act-33" or "grounding" in title_lower or "5-4-3-2-1" in title_lower or act_id == "act-34":
            fit_sentences.append("Grounding exercises reduce anxiety and overthinking.")
        else:
            if category_lower == "breathing":
                fit_sentences.append("This paced breathing exercise targets the nervous system to restore mental clarity.")
            elif category_lower == "mindfulness":
                fit_sentences.append("Mindfulness practices train you to anchor attention in the present moment, calming overactivity.")
            elif category_lower == "sleep hygiene":
                fit_sentences.append("Structuring evening routines supports healthy circadian alignment and natural sleep onset.")
            elif category_lower == "gratitude":
                fit_sentences.append("Practicing gratitude trains the brain to recognize positive aspects of daily life.")
            elif category_lower == "stress management":
                fit_sentences.append("Stress reduction techniques help release mental tension and physical tightness.")

        # 6. Historical journal matches
        if not is_quick and similar_journals_count > 0:
            if similar_journals_count == 1:
                history_sentences.append("1 journal match was found previously.")
            else:
                history_sentences.append(f"{similar_journals_count} journal matches were found previously.")

        # 7. Previous successful activity history
        if total_p > 0:
            if act_id == "act-1":
                success_sentences.append("Box Breathing has helped reduce stress during similar situations.")
            elif act_id == "act-2":
                success_sentences.append("4-7-8 Breathing is a proven tool to help you unwind and prepare for rest.")
            elif act_id == "act-10":
                success_sentences.append("Mindful Walking has previously helped refresh your mood and outlook.")
            else:
                success_sentences.append(f"{selected_act.title} previously helped improve your mood.")
            
            if success_rate_str:
                success_sentences.append(f"Previous success rate: {success_rate_str}.")

        # Include average satisfaction rating from ActivityFeedback if it exists
        fbs = ActivityFeedback.objects.filter(user=user, activity=selected_act)
        if fbs.exists():
            avg_satisfaction = sum(f.satisfaction for f in fbs) / fbs.count()
            success_sentences.append(f"You rated this activity {int(avg_satisfaction)}/5 recently.")

        # Assemble in strict priority order
        reasons_list = []
        if is_case_a:
            reasons_list.append("You're doing well today. No therapeutic activity is needed today. If you'd like to continue building healthy habits, you can explore an optional wellness activity.")
        else:
            if mixed_signal_observation:
                reasons_list.append(mixed_signal_observation)
            
            detected_today = []
            if not mixed_signal_observation:
                detected_today.extend(theme_sentences)
                detected_today.extend(emotion_sentences)
                detected_today.extend(mood_sentences)
                detected_today.extend(journal_sentences)
            
            reasons_list.extend(detected_today)
            reasons_list.extend(fit_sentences)
            reasons_list.extend(history_sentences)
            reasons_list.extend(success_sentences)

        if not reasons_list:
            reasons_list.append("Recommended to support your wellness goals.")

        rectype = 'complete'
        if is_quick:
            rectype = 'quick'
        elif is_case_a:
            rectype = 'wellness'

        rec = Recommendation.objects.create(
            user=user,
            activity=selected_act,
            reason=" ".join(reasons_list),
            is_active=True,
            trigger=rec_trigger,
            journal_theme=rec_theme,
            mood=mood_log.mood if mood_log else 3,
            stress=mood_log.stress if mood_log else 5,
            score=top_score,
            confidence=confidence_val,
            reasons_list=reasons_list,
            rec_type=rectype,
            historical_matches=similar_journals_count if not is_quick else 0,
            success_rate=success_rate_str
        )
        return rec

    @classmethod
    def get_recommendation_history(cls, user):
        return Recommendation.objects.filter(user=user).order_by('-created_at')


class QuickRecommendationService(RecommendationService):
    @classmethod
    def get_quick_recommendation(cls, user, force_recalculate=False):
        today = timezone.localdate()

        # Requires mood check-in
        mood_log_exists = MoodLog.objects.filter(user=user, date=today).exists()
        if not mood_log_exists:
            return None

        # Deactivate recommendations from prior days
        Recommendation.objects.filter(user=user, is_active=True, created_at__date__lt=today).update(is_active=False)

        # Complete takes precedence over quick
        complete_rec = Recommendation.objects.filter(user=user, created_at__date=today, is_active=True, rec_type='complete').first()
        if complete_rec:
            return complete_rec

        if not force_recalculate:
            quick_rec = Recommendation.objects.filter(user=user, created_at__date=today, is_active=True, rec_type='quick').first()
            if quick_rec:
                return quick_rec
        else:
            Recommendation.objects.filter(user=user, created_at__date=today, is_active=True, rec_type='quick').update(is_active=False)

        return cls._generate_recommendation_logic(user, is_quick=True)

