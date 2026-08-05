from django.utils import timezone
from mood.models import MoodLog
from journal.models import JournalEntry
from activities.models import ActivityFeedback
from ai.models import EmotionAnalysis, AIInsight

class AIInsightsService:
    @classmethod
    def generate_insights(cls, user):
        """
        AI service synthesizing mood logs, journaling, and recommendations into weekly insights.
        Summarizes trends, patterns, and recommends focus areas.
        
        Persists reflection summaries in AIInsight database model.
        """
        today = timezone.localdate()
        start_date = today - timezone.timedelta(days=30)
        
        mood_logs = MoodLog.objects.filter(user=user, date__gte=start_date)
        mood_count = mood_logs.count()
        
        # Compute metric averages
        avg_mood = sum([m.mood for m in mood_logs]) / mood_count if mood_count > 0 else 3.0
        avg_stress = sum([m.stress for m in mood_logs]) / mood_count if mood_count > 0 else 4.0
        avg_sleep = sum([float(m.sleep or 7.0) for m in mood_logs]) / mood_count if mood_count > 0 else 7.0
        
        # Split logs into recent (last 7 days) and older periods
        recent_week_logs = list(mood_logs.filter(date__gte=today - timezone.timedelta(days=6)))
        older_period_logs = list(mood_logs.filter(date__lt=today - timezone.timedelta(days=6)))

        # Sub-averages
        avg_recent_mood = sum([m.mood for m in recent_week_logs]) / len(recent_week_logs) if recent_week_logs else 3.0
        avg_older_mood = sum([m.mood for m in older_period_logs]) / len(older_period_logs) if older_period_logs else 3.0
        avg_recent_stress = sum([m.stress for m in recent_week_logs]) / len(recent_week_logs) if recent_week_logs else 4.0
        avg_older_stress = sum([m.stress for m in older_period_logs]) / len(older_period_logs) if older_period_logs else 4.0
        avg_recent_sleep = sum([float(m.sleep or 7.0) for m in recent_week_logs]) / len(recent_week_logs) if recent_week_logs else 7.0
        avg_older_sleep = sum([float(m.sleep or 7.0) for m in older_period_logs]) / len(older_period_logs) if older_period_logs else 7.0
        avg_recent_energy = sum([m.energy for m in recent_week_logs]) / len(recent_week_logs) if recent_week_logs else 3.0
        avg_older_energy = sum([m.energy for m in older_period_logs]) / len(older_period_logs) if older_period_logs else 3.0
        avg_recent_prod = sum([m.productivity for m in recent_week_logs]) / len(recent_week_logs) if recent_week_logs else 3.0
        avg_older_prod = sum([m.productivity for m in older_period_logs]) / len(older_period_logs) if older_period_logs else 3.0

        # 2. Repeated emotions (from EmotionAnalysis linked to user journals)
        emotion_freq = {}
        journals = JournalEntry.objects.filter(user=user, created_at__date__gte=start_date)
        analyses = EmotionAnalysis.objects.filter(journal_entry__in=journals)
        for ana in analyses:
            emotion_freq[ana.primary_emotion] = emotion_freq.get(ana.primary_emotion, 0) + 1
            if ana.secondary_emotion:
                emotion_freq[ana.secondary_emotion] = emotion_freq.get(ana.secondary_emotion, 0) + 1
        
        repeated_emotions = sorted(emotion_freq.items(), key=lambda x: x[1], reverse=True)
        top_emotions = [e[0] for e in repeated_emotions[:3]]

        # 3. Frequent stressors & theme extraction
        theme_freq = {}
        for journal in journals:
            if journal.analysis:
                themes = journal.analysis.get("themes", [])
                for t in themes:
                    theme_freq[t] = theme_freq.get(t, 0) + 1
        
        repeated_themes = sorted(theme_freq.items(), key=lambda x: x[1], reverse=True)
        top_themes = [t[0] for t in repeated_themes[:3]]

        # 4. Successful coping activities (feedback ratings satisfaction >= 4)
        feedbacks = ActivityFeedback.objects.filter(user=user, satisfaction__gte=4).select_related('activity')
        successful_coping = list(set([f.activity.title for f in feedbacks if f.activity]))


        # Calculate Active Twin Profile state using Trajectory deltas
        mood_delta = avg_recent_mood - avg_older_mood
        stress_delta = avg_recent_stress - avg_older_stress
        sleep_delta = avg_recent_sleep - avg_older_sleep
        energy_delta = avg_recent_energy - avg_older_energy
        prod_delta = avg_recent_prod - avg_older_prod
        
        trajectory = mood_delta * 0.3 - stress_delta * 0.25 * 0.4 + sleep_delta * 0.15 + energy_delta * 0.10 + prod_delta * 0.10
        if trajectory > 0.4:
            profile_state = "Improving Stability"
        elif trajectory > 0.1:
            profile_state = "Stable Progress"
        elif trajectory >= -0.1:
            if avg_recent_stress < avg_older_stress - 0.5:
                profile_state = "Recovering"
            else:
                profile_state = "Stable Progress"
        elif trajectory > -0.4:
            profile_state = "Mild Decline"
        else:
            profile_state = "Significant Decline"

        # Determine Focus Area (weakest metric)
        primary_focus = ""
        if "Anxiety" in top_themes or "Stress" in top_themes or avg_recent_stress >= 7.0:
            primary_focus = "Emotional Regulation"
        elif "Academic Stress" in top_themes or "Exams" in top_themes:
            primary_focus = "Academic Balance"
        elif "Loneliness" in top_themes or "Isolation" in top_themes or "Loneliness" in top_emotions:
            primary_focus = "Social Connection"
        elif avg_recent_sleep < 6.5:
            primary_focus = "Sleep Hygiene"
        elif avg_recent_stress >= 5.0:
            primary_focus = "Stress Management"
        elif prod_delta < -0.3 or avg_recent_mood < 2.5:
            primary_focus = "Recovery"
        else:
            primary_focus = "Stress Management"

        # Determine Supporting Rhythm Habit (strongest positive habit)
        habits = []
        sleeps_logged = len([m for m in recent_week_logs if m.sleep is not None])
        if sleeps_logged >= 3 and avg_recent_sleep >= 7.0 and sleep_delta >= -0.2:
            habits.append(("consistent sleep", f"consistent sleep: Maintaining regular sleep cycles averaging {avg_recent_sleep:.1f} hours."))
        if len(recent_week_logs) >= 5:
            habits.append(("regular checkins", "consistent checkins: You maintain a high consistency in logging daily mood checks."))
        if journals.filter(created_at__date__gte=today - timezone.timedelta(days=6)).count() >= 4:
            habits.append(("consistent journaling", "consistent journaling: You maintain routine written reflections, linking themes effectively."))
        from recommendation.models import Recommendation
        recent_completed_recs = Recommendation.objects.filter(user=user, completed=True, created_at__date__gte=today - timezone.timedelta(days=6)).count()
        if recent_completed_recs >= 3:
            habits.append(("regular activity completion", "regular activity completion: Regularly engaging in calming and mindfulness coping routines."))
        if prod_delta > 0.3:
            habits.append(("improving productivity", "improving productivity: Your logs exhibit a steady upward trend in daily task productivity."))
        if energy_delta > 0.3:
            habits.append(("improving energy", "improving energy: You are showing continuous improvement in daily energy levels."))
            
        if habits:
            priority_order = ["consistent sleep", "consistent journaling", "regular checkins", "regular activity completion", "improving productivity", "improving energy"]
            strongest_habit = None
            for p in priority_order:
                found = next((h for h in habits if h[0] == p), None)
                if found:
                    strongest_habit = found[1]
                    break
            if not strongest_habit:
                strongest_habit = habits[0][1]
        else:
            strongest_habit = "consistent checkins: Establishing solid habits by logging baseline checks regularly."

        # Calculate dynamic Recovery Spectrum evidence statement
        recovery_statement = ""
        if len(older_period_logs) > 0 and avg_recent_stress < avg_older_stress:
            reduction_pct = int(((avg_older_stress - avg_recent_stress) / avg_older_stress) * 100)
            if reduction_pct >= 5:
                recovery_statement = f"Your average stress has reduced by {reduction_pct}% during the last two weeks."

        if not recovery_statement:
            recs_8 = Recommendation.objects.filter(user=user, completed=True, created_at__date__gte=today - timezone.timedelta(days=7)).count()
            if recs_8 >= 2:
                recovery_statement = f"You completed coping activities on {recs_8} of the last 8 days."

        if not recovery_statement:
            streak_days = 0
            check_date = today
            while True:
                if JournalEntry.objects.filter(user=user, created_at__date=check_date).exists():
                    streak_days += 1
                    check_date -= timezone.timedelta(days=1)
                else:
                    break
            if streak_days >= 3:
                recovery_statement = f"You have maintained consistent journaling for {streak_days} consecutive days."

        if not recovery_statement and len(older_period_logs) > 0 and avg_recent_mood > avg_older_mood:
            improvement_pct = int(((avg_recent_mood - avg_older_mood) / (avg_older_mood or 1.0)) * 100)
            if improvement_pct >= 5:
                recovery_statement = f"Your average mood has improved by {improvement_pct}% over the last two weeks."

        if not recovery_statement:
            recovery_statement = "Continue logging your progress to unlock personalized recovery insights."

        # Sentence 1: What changed recently
        if len(older_period_logs) > 0:
            if mood_delta > 0.2:
                mood_part = "Your mood has improved compared to last week"
            elif mood_delta < -0.2:
                mood_part = "Your mood has declined compared to last week"
            else:
                mood_part = "Your average mood remains stable"
                
            if sleep_delta < -0.5:
                sleep_part = f"but sleep average is lower at {avg_recent_sleep:.1f} hours"
            elif sleep_delta > 0.5:
                sleep_part = f"and sleep quality has increased to {avg_recent_sleep:.1f} hours"
            else:
                sleep_part = f"while sleep tracks around {avg_recent_sleep:.1f} hours"
            s1 = f"{mood_part}, {sleep_part}."
        else:
            s1 = f"Your logs register an average mood of {avg_mood:.1f}/5.0 and sleep averages {avg_sleep:.1f} hours."

        # Sentence 2: Why the AI believes that
        if top_themes and top_emotions:
            s2 = f"Your recent journals focus on {', '.join(top_themes[:2])} with recurring feelings of {', '.join(top_emotions[:2])}, suggesting these are your primary emotional triggers."
        elif top_themes:
            s2 = f"Your recent journals continue to focus on {', '.join(top_themes[:2])}, suggesting that these topics are your primary emotional triggers."
        elif top_emotions:
            s2 = f"Your active logs exhibit recurring feelings of {', '.join(top_emotions[:2])}, highlighting your current baseline."
        else:
            s2 = "No recurring stress themes have been identified in your daily reflections yet."

        # Sentence 3: Focus Suggestion
        if primary_focus == "Sleep Hygiene":
            s3 = "Focusing on improvements to your sleep routine is likely to produce the biggest benefit over the coming week."
        elif primary_focus == "Stress Management":
            s3 = "Incorporate short somatic breathing exercises to manage stress spikes over the coming week."
        elif primary_focus == "Social Connection":
            s3 = "Focus on scheduling moments of connection to balance daily stress levels."
        elif primary_focus == "Academic Balance":
            s3 = "Creating clear boundaries between studying and rest is recommended to prevent exam fatigue."
        elif primary_focus == "Emotional Regulation":
            s3 = "Applying cognitive focus exercises can help regulate current emotional waves."
        else:
            s3 = "Focusing on completing daily recommended coping activities will help boost your resilience index."

        reflection_body = f"{s1} {s2} {s3}"

        # Persist summary in AIInsight database model
        AIInsight.objects.create(
            user=user,
            summary=reflection_body
        )

        cognitive_distortions = top_themes if top_themes else []

        # Fallback suggested actions
        suggested_actions = successful_coping[:3]
        if not suggested_actions:
            suggested_actions = ["Guided Breathing (5 min)", "Calming Meditation (10 min)", "Somatic Shakeout"]

        return {
            "weekly_summary": reflection_body,
            "cognitive_distortions": cognitive_distortions,
            "focus_areas": [primary_focus],
            "average_mood_score": round(avg_mood, 2),
            "average_stress_score": round(avg_stress, 2),
            "data_completeness": "High" if mood_count >= 5 else "Medium" if mood_count >= 2 else "Low",
            "suggested_actions": suggested_actions,
            "profile_state": profile_state,
            "supporting_habit": strongest_habit,
            "recovery_spectrum": recovery_statement,
            "primary_focus_area": primary_focus
        }
