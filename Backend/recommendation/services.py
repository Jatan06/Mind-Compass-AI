from django.utils import timezone
from django.db import models
from .models import Recommendation
from activities.models import TherapyActivity, ActivityFeedback
from mood.models import MoodLog
from assessment.models import AssessmentResponse
from journal.models import JournalEntry

class RecommendationService:

    # ─────────────────────────────────────────────────────────────
    #  Mood–Journal Conflict Detection (70% journal / 30% mood)
    # ─────────────────────────────────────────────────────────────
    @classmethod
    def _detect_conflict(cls, mood_log, journal_entry):
        """
        Returns (has_conflict: bool, conflict_reason: str).
        """
        if not mood_log or not journal_entry:
            return False, ""

        journal_sent = ""
        if journal_entry.analysis:
            journal_sent = journal_entry.analysis.get("sentiment", "Neutral")

        mood_val = mood_log.mood
        has_conflict = False
        conflict_reason = ""

        # Case 2: Mood = Happy (>= 4), Journal = Negative
        if mood_val >= 4 and journal_sent == "Negative":
            has_conflict = True
            conflict_reason = (
                "Although your mood check-in indicates a positive mood, today's journal "
                "reflects emotional distress. Recommendations are therefore based on your journal."
            )

        # Case 3: Mood = Sad (<= 2), Journal = Positive
        elif mood_val <= 2 and journal_sent == "Positive":
            has_conflict = True
            conflict_reason = (
                "Although your mood check-in suggests a difficult day, today's journal "
                "reflects a positive emotional state. Recommendations are therefore based on your journal."
            )

        return has_conflict, conflict_reason


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

            # Search previous journals for similar themes in past 30 days
            past_journals = JournalEntry.objects.filter(
                user=user,
                created_at__date__gte=today - timezone.timedelta(days=30)
            )
            if journal_entry:
                past_journals = past_journals.exclude(pk=journal_entry.pk)

            similar_journals_count = 0
            for pj in past_journals:
                pj_themes = []
                if pj.analysis:
                    pj_themes = [t.lower() for t in pj.analysis.get("themes", [])]
                
                has_theme_overlap = any(t in pj_themes for t in journal_themes) if journal_themes else False
                
                if has_theme_overlap:
                    similar_journals_count += 1

            # Emotion matching uses ONLY today's journal emotion.
            # Historical emotions (past 30 days) must NOT influence today's activity selection —
            # they caused overfitting to old onboarding-period emotions (e.g. exam anxiety
            # from weeks ago bleeding into a gratitude journal day).
            from ai.models import EmotionAnalysis
            today_emotion_qs = EmotionAnalysis.objects.filter(
                journal_entry=journal_entry
            ) if journal_entry else EmotionAnalysis.objects.none()
            recent_primary_emotions = [ea.primary_emotion.lower() for ea in today_emotion_qs]

        # Gather activity feedback metrics and recent recommendation history once for the user
        feedbacks = list(ActivityFeedback.objects.filter(user=user).select_related('activity'))
        activity_fb_map = {}
        for fb in feedbacks:
            act_id = fb.activity_id
            if act_id not in activity_fb_map:
                activity_fb_map[act_id] = []
            activity_fb_map[act_id].append(fb)

        recent_recommendations = list(
            Recommendation.objects.filter(user=user).select_related('activity').order_by('-created_at')
        )

        # Calculate scores for all activities in database
        activities = list(TherapyActivity.objects.all())
        if not activities:
            return None

        # Evaluate conflict, Case 1, Case 3, and Wellness conditions
        has_conflict, conflict_reason = False, ""
        is_case_1 = False
        is_case_3 = False
        is_wellness_only = False

        if mood_log:
            journal_sent = ""
            if not is_quick and journal_entry and journal_entry.analysis:
                journal_sent = journal_entry.analysis.get("sentiment", "Neutral")

            has_conflict, conflict_reason = cls._detect_conflict(mood_log, journal_entry) if not is_quick else (False, "")

            if not is_quick:
                if mood_log.mood >= 4 and journal_sent == "Positive":
                    is_case_1 = True
                    is_wellness_only = True
                elif mood_log.mood <= 2 and journal_sent == "Positive":
                    is_case_3 = True
                    is_wellness_only = True
            else:
                if mood_log.mood >= 4:
                    is_wellness_only = True

        if is_wellness_only:
            wellness_ids = ['act-17', 'act-20', 'act-25', 'act-6', 'act-18', 'act-19', 'act-26', 'act-37', 'act-11', 'act-5']
            activities = [act for act in activities if act.id in wellness_ids]

        # ── Clinical target routing ───────────────────────────────────
        # OVERRIDES REMOVED: In order to ensure evidence-based algorithmic distribution,
        # we rely strictly on the Suitability Score mechanism instead of overriding 
        # selections based on hard-coded ID tags.

        activity_scores = {}
        reasons_map = {}

        def val_fmt(val):
            return int(val) if isinstance(val, (int, float)) and val == int(val) else round(val, 2)

        for act in activities:
            # ── NEW SUITABILITY SCORE NORMALIZATION ──
            mood_match = 0.0
            emotion_match = 0.0
            topic_match = 0.0
            historical_success = 0.0
            user_preference = 0.0
            completion_rate = 0.0
            skip_penalty = 0.0
            recent_repetition = 0.0

            # Evaluate Mood Match
            current_mood_match = 0.0
            current_stress_match = 0.0
            if mood_log:
                if act.mood_range and len(act.mood_range) == 2:
                    if act.mood_range[0] <= mood_log.mood <= act.mood_range[1]:
                        current_mood_match = 1.0
                if act.stress_range and len(act.stress_range) == 2:
                    if act.stress_range[0] <= mood_log.stress <= act.stress_range[1]:
                        current_stress_match = 1.0
            mood_match = (current_mood_match + current_stress_match) / 2.0

            # ── Organic Clinical Check Boosts ──
            if mood_log:
                # Poor Sleep Boost
                if mood_log.sleep is not None and float(mood_log.sleep) < 6.0:
                    if "sleep" in act.topics or "sleep" in act.category.lower() or "sleep" in act.title.lower():
                        mood_match += 1.0
                # Low Energy Boost
                if mood_log.energy <= 3:
                    if "somatic" in act.category.lower() or "physical activity" in act.category.lower() or "energy" in act.topics or "fatigue" in act.emotions:
                        mood_match += 1.0
                # High Stress Boost
                if mood_log.stress >= 7:
                    if "breathing" in act.category.lower() or "grounding" in act.category.lower() or "stress" in act.topics or "stress" in act.category.lower():
                        mood_match += 1.0
                # Low Mood Distressed Boost
                if mood_log.mood <= 2:
                    if "grounding" in act.category.lower() or "emotional regulation" in act.category.lower() or "sadness" in act.topics or "sad" in act.title.lower() or "sadness" in act.emotions:
                        mood_match += 1.0
                # Low Productivity Boost
                if mood_log.productivity is not None and mood_log.productivity <= 3:
                    if "stress management" in act.category.lower() or "focus" in act.topics or "work" in act.topics or "eisenhower" in act.title.lower() or "motivation" in act.emotions:
                        mood_match += 1.0
                # Low Social Connection Boost
                if mood_log.social is not None and mood_log.social <= 3:
                    if "gratitude" in act.category.lower() or "lonely" in act.emotions or "relationship" in act.topics or "family" in act.topics or "social" in act.topics:
                        mood_match += 1.0

            # Goal-based bias: only apply a small nudge (0.2) when today's journal
            # has NO detected topics of its own. If today's journal already has topics,
            # the user's current state is clear and the onboarding profile must not interfere.
            if goals and not journal_themes:
                if any("sleep" in g for g in goals) and ("sleep" in act.topics or "sleep" in act.category.lower() or "sleep" in act.title.lower()):
                    mood_match += 0.2
                if any("stress" in g or "anxi" in g for g in goals) and ("Anxiety" in act.emotions or "Stress" in act.emotions or "breathing" in act.category.lower() or "stress" in act.topics or "grounding" in act.category.lower()):
                    mood_match += 0.2

            # Evaluate Emotion Match
            for emotion in recent_primary_emotions:
                if emotion in act.emotions:
                    emotion_match = 1.0
            combined_text = ""
            if mood_log and mood_log.notes:
                combined_text += " " + mood_log.notes.lower()
            if today_text:
                combined_text += " " + today_text.lower()
            if combined_text:
                import re
                has_match = False
                for e in act.emotions:
                    el = e.lower()
                    # Use word-boundary matching to avoid false positives from partial matches
                    if re.search(r'\b' + re.escape(el) + r'\b', combined_text):
                        has_match = True
                for t in act.topics:
                    tl = t.lower()
                    if re.search(r'\b' + re.escape(tl) + r'\b', combined_text):
                        has_match = True
                if has_match:
                    emotion_match = 1.0

            # Evaluate Topic Match
            journal_themes_lower = [t.lower() for t in journal_themes]
            for theme in journal_themes_lower:
                if theme in act.topics or theme in act.category.lower() or theme in act.title.lower():
                    topic_match = 1.0

            # ── LEGACY REASONS TRACKING (Preserved for Regression & Testing) ──
            mood_reasons = []
            theme_reasons = []
            success_reasons = []
            feedback_reasons = []

            category_lower = act.category.lower()
            title_lower = act.title.lower()

            if mood_log:
                if mood_log.stress >= 5 and ("breathing" in category_lower or "somatic" in category_lower):
                    mood_reasons.append("Matches your elevated stress pattern today.")
                elif float(mood_log.sleep or 7.0) < 7.0 and "sleep" in title_lower:
                    mood_reasons.append("Aligned with your sleep pattern metrics.")
            elif goals:
                if any("sleep" in g for g in goals) and ("sleep" in title_lower or "sleep" in category_lower):
                    mood_reasons.append("Supports your target goals to improve sleep.")
                elif any("stress" in g or "anxi" in g for g in goals) and ("breathing" in category_lower or "somatic" in category_lower):
                    mood_reasons.append("Encouraged to support stress reduction goals.")

            matched_themes_activity = []
            for theme in journal_themes_lower:
                if theme in category_lower or theme in title_lower or theme in act.description.lower():
                    matched_themes_activity.append(theme)
                if theme in ["exam", "study", "assignments", "placement", "deadlines"] and act.id in ["act-1", "act-2", "act-8", "act-12"]:
                    matched_themes_activity.append(theme)
                if theme in ["work", "deadlines"] and act.id in ["act-25", "act-26", "act-35", "act-36"]:
                    matched_themes_activity.append(theme)
                if theme in ["sleep"] and act.id in ["act-14", "act-15", "act-16"]:
                    matched_themes_activity.append(theme)
                if theme in ["relationship", "family"] and act.id in ["act-6", "act-18", "act-49", "act-50"]:
                    matched_themes_activity.append(theme)

            has_matching_emotion = False
            for emotion in recent_primary_emotions:
                if emotion in ["sad", "lonely", "grief"] and ("gratitude" in category_lower or "relaxation" in category_lower):
                    has_matching_emotion = True
                elif emotion in ["anxiety", "stress", "fear", "overwhelmed", "frustrated"] and ("breathing" in category_lower or "grounding" in category_lower or "somatic" in category_lower):
                    has_matching_emotion = True
            
            if has_matching_emotion:
                theme_reasons.append(f"Recent emotion analysis detected patterns of negative emotions like {', '.join(sorted(list(set(recent_primary_emotions))))}.")

            # Historical Processing
            past_completed = [r for r in recent_recommendations if r.activity_id == act.id and r.completed]
            past_all = [r for r in recent_recommendations if r.activity_id == act.id]
            if past_all:
                completion_rate = len(past_completed) / len(past_all)
            
            avg_impr = None
            if past_completed:
                avg_impr = sum(r.improvement_score or 0.0 for r in past_completed) / len(past_completed)
                if avg_impr is not None:
                    historical_success = min(1.0, max(0.0, avg_impr / 3.0))
                    if avg_impr >= 1.5:
                        success_reasons.append(f"{act.title} previously reduced your average stress level.")
                    elif avg_impr >= 0.5:
                        success_reasons.append(f"{act.title} showed moderate mood benefit previously.")

            fbs = activity_fb_map.get(act.id, [])
            avg_satisfaction = None
            if fbs:
                avg_satisfaction = sum(f.satisfaction for f in fbs) / len(fbs)
                user_preference = avg_satisfaction / 5.0
                
                latest_fb = sorted(fbs, key=lambda f: f.created_at, reverse=True)[0]
                days_ago = (today - latest_fb.created_at.date()).days
                if days_ago < 2:
                    recent_repetition = 1.0
                elif days_ago < 5:
                    recent_repetition = 0.5

            if matched_themes_activity:
                if similar_journals_count > 0:
                    if avg_satisfaction is not None:
                        theme_reasons.append(
                            f"Similar {matched_themes_activity[0]}-related stress was detected {similar_journals_count} times previously. "
                            f"{act.title} helped reduce your stress and was rated {int(avg_satisfaction)}/5, so it is recommended again."
                        )
                    else:
                        theme_reasons.append(f"Similar {matched_themes_activity[0]}-related stress was detected {similar_journals_count} times previously.")
                else:
                    theme_reasons.append(f"Your journal indicates {matched_themes_activity[0]}-related concerns.")
            
            if avg_satisfaction is not None and not (matched_themes_activity and similar_journals_count > 0):
                feedback_reasons.append(f"You completed this activity successfully and rated it {int(avg_satisfaction)}/5.")

            ignored_recs = [r for r in recent_recommendations if r.activity_id == act.id and not r.completed and r.created_at.date() >= today - timezone.timedelta(days=3)]
            if ignored_recs:
                skip_penalty = min(1.0, len(ignored_recs) / 3.0)

            # CALCULATE ACTUAL SCORE EXCLUSIVELY VIA SUITABILITY
            organic = (mood_match + emotion_match + topic_match + historical_success + user_preference + completion_rate) - (skip_penalty + recent_repetition)
            total_score = max(1.0, organic * 16.6)

            
            # Compute tie-breaking metrics
            # 1. Better topic match
            topic_match_score = 0
            for theme in journal_themes_lower:
                if theme in act.topics or theme in act.category.lower() or theme in act.title.lower():
                    topic_match_score += 1

            # 2. Better emotion match
            emotion_match_score = 0
            for emotion in recent_primary_emotions:
                if emotion in act.emotions:
                    emotion_match_score += 1
            if mood_log and mood_log.notes:
                notes_lower = mood_log.notes.lower()
                for e in act.emotions:
                    if e.lower() in notes_lower:
                        emotion_match_score += 1

            # 3. Higher historical success
            if past_completed:
                user_success = avg_impr if avg_impr is not None else 0.0
            else:
                user_success = act.agg_avg_improvement

            # 4. Higher completion rate
            if past_all:
                comp_rate = len(past_completed) / len(past_all)
            else:
                comp_rate = act.agg_completed / act.agg_started if act.agg_started > 0 else 0.0

            # 5. Lower skip rate
            if past_all:
                past_skipped = [r for r in past_all if not r.completed]
                skip_rate = len(past_skipped) / len(past_all)
            else:
                skip_rate = (act.agg_total_recommendations - act.agg_completed) / act.agg_total_recommendations if act.agg_total_recommendations > 0 else 0.0

            # 6. Less recent repetition
            last_rec = next((r for r in recent_recommendations if r.activity_id == act.id), None)
            if last_rec:
                days_since_last_rec = (today - last_rec.created_at.date()).days
            else:
                days_since_last_rec = 9999

            # 7. Deterministic numeric ID fallback
            try:
                numeric_id = int(act.id.split('-')[-1])
            except (ValueError, IndexError):
                numeric_id = 9999

            # Multi-tiered tie-breaker sorting tuple
            sort_tuple = (
                total_score,
                topic_match_score,
                emotion_match_score,
                user_success,
                comp_rate,
                -skip_rate,
                days_since_last_rec,
                -numeric_id
            )
            activity_scores[act] = sort_tuple
            
            # Combine point explanations
            all_reasons = []
            all_reasons.extend(mood_reasons)
            all_reasons.extend(theme_reasons)
            all_reasons.extend(success_reasons)
            all_reasons.extend(feedback_reasons)
            
            if mood_match >= 1.0 and "Matches your elevated stress pattern today." not in all_reasons and "Aligned with your sleep pattern metrics." not in all_reasons:
                if "Topic" not in str(all_reasons): # Prevent duplication
                    all_reasons.append("Clinically recommended based on your recent mood check-in states.")
                    
            if emotion_match >= 1.0 and "Recent emotion analysis detected" not in str(all_reasons):
                all_reasons.append("Targets and down-regulates your most recent negative emotional trends.")
            
            if not all_reasons:
                all_reasons.append(f"Recommended tool to support your goals.")
            
            reasons_map[act] = all_reasons

        # Pick highest scoring activity
        sorted_acts = sorted(activity_scores.items(), key=lambda item: item[1], reverse=True)
        selected_act, top_score_tuple = sorted_acts[0]
        top_score = top_score_tuple[0]
        
        confidence_val = min(0.99, max(0.50, top_score / 100.0))
        
        rec_theme = ", ".join(journal_themes) if journal_themes else ""
        rec_trigger = today_text[:200] if today_text else ""

        # Activity success rate calculation
        total_p = sum(1 for r in recent_recommendations if r.activity_id == selected_act.id and r.created_at.date() < today)
        completed_p = sum(1 for r in recent_recommendations if r.activity_id == selected_act.id and r.completed and r.created_at.date() < today)
        if total_p > 0:
            rate_p = int((completed_p / total_p) * 100)
            success_rate_str = f"{rate_p}%"
        else:
            rate_p = None
            success_rate_str = None

        # Build explanation sentences dynamically based ONLY on factors that actually contributed
        reasons_list = []
        
        # 1. Conflict Explanation (Rule 4)
        if has_conflict and conflict_reason:
            reasons_list.append(conflict_reason)
            
        # 2. Activity Justification
        act_id = selected_act.id
        title = selected_act.title
        category = selected_act.category.lower()
        
        # Analyze journal emotions/topics if available (and not quick recommender)
        journal_pos = False
        journal_neg = False
        journal_distress = False
        journal_topics = []
        journal_emotions = []
        sentences = []
        has_sad_sent = has_anx_sent = has_stress_sent = has_lonely_sent = has_overwhelmed_sent = has_exhausted_sent = False
        
        if not is_quick and journal_entry:
            sentences = []
            if journal_entry.analysis:
                sentences = journal_entry.analysis.get("sentences", [])
            if not isinstance(sentences, list):
                sentences = []
            if not sentences and journal_entry.text:
                from ai.utils.preprocessing import analyze_text_nlp
                try:
                    sentences = analyze_text_nlp(journal_entry.text).get("sentences", [])
                except Exception:
                    sentences = []
            if not isinstance(sentences, list):
                sentences = []
                
            # Collect topics and emotions
            for s in sentences:
                if isinstance(s, dict):
                    for t in s.get("topics", []):
                        journal_topics.append(t.lower())
                    if s.get("emotion"):
                        journal_emotions.append(s.get("emotion"))
                    if s.get("sentiment") == "Negative" or s.get("status") == "distress":
                        journal_distress = True
            
            # Determine if journal is positive or negative
            if journal_entry.analysis:
                j_sentiment = journal_entry.analysis.get("sentiment", "Neutral")
                # Fallback if themes are defined without sentences
                if not journal_topics and "themes" in journal_entry.analysis:
                    for theme in journal_entry.analysis.get("themes", []):
                        journal_topics.append(theme.lower())
            else:
                j_sentiment = "Neutral"
            if j_sentiment == "Positive":
                journal_pos = True
            elif j_sentiment == "Negative" or journal_distress:
                journal_neg = True
                
        # Gather check-in evidence summary
        mood_check_aspects = []
        if mood_log:
            if mood_log.mood <= 2:
                mood_check_aspects.append("low mood")
            elif mood_log.mood >= 4:
                if mood_log.mood >= 5:
                    mood_check_aspects.append("that your mood is excellent")
                else:
                    mood_check_aspects.append("a positive mood")
            
            if mood_log.stress >= 7:
                mood_check_aspects.append("elevated stress levels")
            if mood_log.energy <= 3:
                mood_check_aspects.append("low energy levels")
            if mood_log.sleep is not None and float(mood_log.sleep) < 6.0:
                val_fmt_sleep = val_fmt(mood_log.sleep)
                mood_check_aspects.append(f"short sleep duration of {val_fmt_sleep} hours")

        if mood_check_aspects:
            if len(mood_check_aspects) == 1:
                reasons_list.append(f"Today's mood check-in reflects {mood_check_aspects[0]}.")
            elif len(mood_check_aspects) == 2:
                reasons_list.append(f"Today's mood check-in reflects {mood_check_aspects[0]} and {mood_check_aspects[1]}.")
            else:
                reasons_list.append(f"Today's mood check-in reflects {', '.join(mood_check_aspects[:-1])}, and {mood_check_aspects[-1]}.")

        # Gather journal evidence summary
        if not is_quick and journal_entry:
            # Check for study topic — require actual study/exam words in the raw text
            # to avoid false positives from "learn" in gratitude or recovery journals.
            STUDY_EXPLICIT_WORDS = {"exam", "exams", "midterm", "final", "grade", "quiz", "test", "cramming", "study", "homework", "assignment", "lecture", "class", "university", "college", "school"}
            journal_items = []
            has_real_study = (
                ("study" in journal_topics or "exam" in journal_topics or "exams" in journal_topics)
                and any(w in journal_entry.text.lower() for w in STUDY_EXPLICIT_WORDS)
            )
            if has_real_study:
                has_academic_distress = journal_neg or (mood_log and mood_log.stress >= 7)
                if has_academic_distress:
                    if any(w in journal_entry.text.lower() for w in ["academic", "exam", "midterm", "final", "grade"]):
                        journal_items.append("academic stress")
                    else:
                        journal_items.append("study-related stress")
                else:
                    journal_items.append("studies")
                    
            if "work" in journal_topics or "career" in journal_topics:
                has_work_distress = journal_neg or (mood_log and mood_log.stress >= 7)
                if has_work_distress:
                    if "workplace" in journal_entry.text.lower():
                        journal_items.append("workplace stress")
                    else:
                        journal_items.append("work-related stress")
                else:
                    journal_items.append("work")
                    
            if "family" in journal_topics:
                has_family_distress = journal_neg or (mood_log and mood_log.stress >= 7)
                if has_family_distress:
                    journal_items.append("family concerns")
                else:
                    journal_items.append("family time")
                    
            if "friends" in journal_topics:
                journal_items.append("interactions with friends")
                
            if "exercise" in journal_topics:
                journal_items.append("physical activity")
                
            if "sleep" in journal_topics:
                has_sleep_distress = journal_neg or (mood_log and float(mood_log.sleep or 7.0) < 6.0)
                if has_sleep_distress:
                    journal_items.append("difficulty relaxing before sleep")
                else:
                    journal_items.append("sleep patterns")
                    
            # Emotions
            if has_sad_sent or "Sad" in journal_emotions:
                journal_items.append("sadness")
            if has_anx_sent or "Anxiety" in journal_emotions:
                journal_items.append("findings of anxiety and anxious thoughts")
            if has_stress_sent or "Stress" in journal_emotions:
                journal_items.append("stressful thoughts")
            if has_lonely_sent or "Lonely" in journal_emotions:
                journal_items.append("loneliness")
            if has_overwhelmed_sent or "Overwhelmed" in journal_emotions:
                journal_items.append("feeling overwhelmed")
            if has_exhausted_sent or "Emotionally exhausted" in journal_emotions:
                journal_items.append("emotional exhaustion")

            if journal_items:
                concern_keywords = ["stress", "concerns", "difficulty", "sadness", "anxiety", "anxious", "loneliness", "overwhelmed", "exhaustion"]
                has_concerns = any(any(cw in ji for cw in concern_keywords) for ji in journal_items)
                
                if len(journal_items) == 1:
                    item = journal_items[0]
                    if has_concerns:
                        journal_sentence = f"Today's journal indicates {item}."
                    else:
                        journal_sentence = f"Today's journal describes notes regarding {item}."
                elif len(journal_items) == 2:
                    item1, item2 = journal_items[0], journal_items[1]
                    if has_concerns:
                        journal_sentence = f"Today's journal highlights {item1} alongside {item2}."
                    else:
                        journal_sentence = f"Today's journal reflects positive elements of {item1} and {item2}."
                else:
                    first_part = ", ".join(journal_items[:-1])
                    last_part = journal_items[-1]
                    if has_concerns:
                        journal_sentence = f"Today's journal expresses details of {first_part}, along with {last_part}."
                    else:
                        journal_sentence = f"Today's journal reflects positive experiences involving {first_part}, and {last_part}."
                        
                reasons_list.append(journal_sentence)

        # 3. Build Activity Justification (explicitly connecting today's state)
        mood_details = []
        if mood_log:
            if mood_log.mood <= 2:
                mood_details.append("a low mood")
            elif mood_log.mood >= 5:
                mood_details.append("that your mood is excellent")
            elif mood_log.mood >= 4:
                mood_details.append("a positive mood")
            if mood_log.stress >= 7:
                mood_details.append("elevated stress")
            if mood_log.energy <= 3:
                mood_details.append("decreased energy levels")
                
        mood_str = " and ".join(mood_details[:2]) if mood_details else ""
        
        journal_details = []
        if not is_quick and journal_entry:
            present_em_list = []
            if has_sad_sent or "Sad" in journal_emotions: present_em_list.append("sadness")
            if has_anx_sent or "Anxiety" in journal_emotions: present_em_list.append("anxious thoughts")
            if has_stress_sent or "Stress" in journal_emotions: present_em_list.append("stress")
            if has_lonely_sent or "Lonely" in journal_emotions: present_em_list.append("loneliness")
            if has_overwhelmed_sent or "Overwhelmed" in journal_emotions: present_em_list.append("feeling overwhelmed")
            if has_exhausted_sent or "Emotionally exhausted" in journal_emotions: present_em_list.append("emotional exhaustion")
            
            if present_em_list:
                journal_details.append(f"feelings of {' and '.join(present_em_list[:2])}")
            if journal_topics:
                natural_topics = []
                for t in journal_topics:
                    if t == "study" or t == "exam" or t == "exams":
                        natural_topics.append("academic studies")
                    elif t == "work" or t == "career":
                        natural_topics.append("work demands")
                    elif t == "family":
                        natural_topics.append("family relationships")
                    elif t == "friends":
                        natural_topics.append("social connections")
                    elif t == "exercise":
                        natural_topics.append("exercise")
                if natural_topics:
                    journal_details.append(f"topics concerning {', '.join(natural_topics[:2])}")
                    
        journal_str = " alongside ".join(journal_details[:2]) if journal_details else ""
        
        conflict_str = "an emotional conflict between check-in states and written reflections" if has_conflict else ""
        
        connection_parts = []
        if mood_str:
            connection_parts.append(f"today's mood check-in indicates {mood_str}")
        if journal_str:
            connection_parts.append(f"today's journal describes {journal_str}")
        if conflict_str:
            connection_parts.append(f"there is {conflict_str}")
            
        if len(connection_parts) == 1:
            state_summary = connection_parts[0]
        elif len(connection_parts) == 2:
            state_summary = f"{connection_parts[0]} and {connection_parts[1]}"
        elif len(connection_parts) >= 3:
            state_summary = f"{connection_parts[0]}, {connection_parts[1]}, and {connection_parts[2]}"
        else:
            state_summary = "your logs suggest a neutral state"
            
        justification = ""
        # Let's map explanations to each activity class using natural language
        if act_id == "act-1": # Box Breathing
            justification = f"Box Breathing was selected because {state_summary}. Paced breathing directly targets autonomic regulation to restore mental clarity and reduce acute stress."
        elif act_id == "act-37": # Somatic Shakeout
            justification = f"Somatic Shakeout was selected because {state_summary}. Active physical movement helps release bodily stress and boost physical energy."
        elif act_id in ["act-15", "act-16", "act-14"] or category == "sleep hygiene":
            justification = f"{title} was selected because {state_summary}. Structuring your evening routine reduces repetitive thoughts before bed to support natural sleep onset."
        elif act_id in ["act-33", "act-34"] or category == "grounding":
            justification = f"{title} was selected because {state_summary}. Shifting focus to immediate sensory inputs helps anchor your attention and stop emotional overthinking."
        elif act_id == "act-12" or category == "mindfulness":
            justification = f"{title} was selected because {state_summary}. This mindful breathing exercise helps you pause and break automatic stress responses."
        elif act_id == "act-17" or category == "gratitude":
            justification = f"Three Good Things was selected because {state_summary}. Reflecting on positive events amplifies gratitude and reinforces emotional wellbeing."
        elif act_id == "act-10" or act_id == "act-26" or "walk" in title.lower():
            justification = f"Mindful Walking was selected because {state_summary}. Light movement and grounding help maintain your current wellbeing."
        else:
            if category == "breathing":
                justification = f"{title} was selected because {state_summary}. Paced breathing regulates your nervous system to calm emotional activity."
            elif category == "mindfulness":
                justification = f"{title} was selected because {state_summary}. Grounding observations regulate anxiety and bring focus."
            elif category == "sleep hygiene":
                justification = f"{title} was selected because {state_summary}. A relaxing bedtime routine supports healthy circadian rest."
            elif category == "gratitude":
                justification = f"{title} was selected because {state_summary}. Reflecting on positive daily elements encourages wellbeing."
            elif category == "stress management":
                justification = f"{title} was selected because {state_summary}. Relaxing activities support down-regulation of stress."
            else:
                justification = f"{title} was selected because {state_summary}. This activity helps release both physical and mental tension."

        # 4. Append historical context and success rate if present
        if not is_quick and similar_journals_count > 0:
            if similar_journals_count == 1:
                reasons_list.append("1 journal match was found previously.")
            else:
                reasons_list.append(f"{similar_journals_count} journal matches were found previously.")
 
        if total_p > 0:
            if act_id == "act-1":
                reasons_list.append("Box Breathing has helped reduce stress during similar situations in your history.")
            elif act_id == "act-2":
                reasons_list.append("4-7-8 Breathing is a proven tool in your history to help you unwind and prepare for rest.")
            elif act_id == "act-10":
                reasons_list.append("Mindful Walking has previously helped refresh your mood and outlook.")
            else:
                reasons_list.append(f"{title} previously helped improve your mood.")
            
            if success_rate_str:
                reasons_list.append(f"Previous success rate: {success_rate_str}.")
 
        fbs_list = ActivityFeedback.objects.filter(user=user, activity=selected_act)
        if fbs_list.exists():
            avg_satisfaction = sum(f.satisfaction for f in fbs_list) / fbs_list.count()
            reasons_list.append(f"You rated this activity {int(avg_satisfaction)}/5 recently.")

        # Always append activity justification at the end!
        reasons_list.append(justification)

        if not reasons_list:
            reasons_list.append("Recommended to support your wellness goals.")

        rectype = 'complete'
        if is_quick:
            rectype = 'quick'
        elif is_wellness_only:
            rectype = 'wellness'

        # Generate recommendation's independent personal suggestion
        daily_suggestion = cls._generate_suggestion(journal_entry, mood_log)

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
            success_rate=success_rate_str,
            daily_suggestion=daily_suggestion
        )
        rec._has_conflict = has_conflict
        rec._conflict_reason = conflict_reason
        return rec

    @classmethod
    def _generate_suggestion(cls, journal_entry, mood_log=None):
        text_lower = journal_entry.text.lower() if (journal_entry and journal_entry.text) else ""
        
        # 1. Determine topics
        detected_topics = set()
        if journal_entry and journal_entry.analysis:
            sentences = journal_entry.analysis.get("sentences", [])
            if isinstance(sentences, list):
                for s in sentences:
                    if isinstance(s, dict):
                        for topic in s.get("topics", []):
                            detected_topics.add(topic.lower())
            
            # Fallback to themes if sentences is empty
            if not detected_topics and "themes" in journal_entry.analysis:
                for theme in journal_entry.analysis.get("themes", []):
                    detected_topics.add(theme.lower())
                    
        # If no journal text or no detected topics, use fallback suggestions
        if not text_lower or not detected_topics:
            mood_val = mood_log.mood if mood_log else 3
            if mood_val <= 2:
                return "Take a short mindful walk."
            elif mood_val >= 4:
                return "Continue your healthy routine."
            elif mood_log and float(mood_log.sleep or 7.0) < 6.0:
                return "Take a few minutes to relax today."
            else:
                return "Stay hydrated today."
                
        # Primary topic determination
        # For study, require actual study/exam words directly in the text to avoid
        # false positives from "learn" in gratitude/recovery journals.
        STUDY_EXPLICIT = {"exam", "exams", "midterm", "final", "grade", "quiz", "test", "cramming", "study", "homework", "assignment", "lecture", "class", "university", "college", "school"}
        has_work = "work" in detected_topics or "career" in detected_topics
        has_sleep = "sleep" in detected_topics
        has_study = (
            ("study" in detected_topics or "exam" in detected_topics or "exams" in detected_topics)
            and any(w in text_lower for w in STUDY_EXPLICIT)
        )
        has_family = "family" in detected_topics
        has_friends = "friends" in detected_topics
        has_exercise = "exercise" in detected_topics
        
        # 2. Topic-based suggestion logic with priority on primary emotional issue
        
        # Work + Sleep Co-occurrence
        if has_work and has_sleep:
            if any(w in text_lower for w in ["thinking", "worry", "worried", "deadline", "task", "night", "bed", "sleep", "mind"]):
                if any(w in text_lower for w in ["task", "priority", "finish"]):
                    return "Finish your highest-priority task first tomorrow."
                elif any(w in text_lower for w in ["deadline", "late", "evening"]):
                    return "Avoid continuing work immediately before bedtime."
                else:
                    return "Write tomorrow's task list before bed."
            
        # Work only
        if has_work:
            if any(w in text_lower for w in ["break", "hour", "session", "continuous", "interval"]):
                return "Take short breaks between work sessions."
            elif any(w in text_lower for w in ["task", "priority", "tomorrow", "plan"]):
                return "Plan tomorrow's highest-priority task before ending today's work."
            else:
                return "Maintain a healthy work-life balance."
                
        # Sleep only
        if has_sleep:
            if any(w in text_lower for w in ["screen", "phone", "tv", "laptop", "device"]):
                return "Avoid screens before sleeping."
            elif any(w in text_lower for w in ["thinking", "worry", "thought", "mind", "tomorrow"]):
                return "Write tomorrow's tasks before bed to reduce bedtime overthinking."
            else:
                return "Follow a relaxing bedtime routine tonight."
                
        # Family
        if has_family:
            return "Continue spending quality time with your family this week."
            
        # Friends
        if has_friends:
            return "Stay connected with your friends this week."
            
        # Study
        if has_study:
            return "Continue taking regular study breaks to maintain focus."
            
        # Exercise
        if has_exercise:
            return "Maintain your exercise routine."
            
        # Fallback suggestions if topics don't map to specified lists
        mood_val = mood_log.mood if mood_log else 3
        if mood_val <= 2:
            return "Take a short mindful walk."
        elif mood_val >= 4:
            return "Continue your healthy routine."
        else:
            return "Take a few minutes to relax today."


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

