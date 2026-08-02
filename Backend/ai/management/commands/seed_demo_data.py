import random
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.utils import timezone
from django.contrib.auth import get_user_model

from users.models import UserProfile
from mood.models import MoodLog
from journal.models import JournalEntry
from activities.models import TherapyActivity, ActivityFeedback
from recommendation.models import Recommendation
from ai.models import EmotionAnalysis, MoodPrediction, AIInsight

User = get_user_model()

class Command(BaseCommand):
    help = "Seed 30 days of realistic mental wellness history for two demo users"

    def handle(self, *args, **options):
        self.stdout.write("Running seed_activities command to ensure all activities are present...")
        call_command('seed_activities')

        self.stdout.write("Cleaning up existing demo users...")
        User.objects.filter(username__in=['alex_student', 'sarah_engineer']).delete()

        # 1. Create alex_student
        alex = User.objects.create(
            username='alex_student',
            email='alex.student@example.com',
            is_active=True
        )
        alex.set_password('Password123!')
        alex.save()

        alex_profile, _ = UserProfile.objects.get_or_create(user=alex)
        alex_profile.occupation = 'Student'
        alex_profile.sleep_hours = 6.5
        alex_profile.exercise_frequency = '1–2 Days'
        alex_profile.screen_time = 8.5
        alex_profile.water_intake = 2.0
        alex_profile.goals = ['Reduce Stress', 'Increase Focus', 'Improve Sleep']
        alex_profile.coping_methods = ['Deep Breathing', 'Walking', 'Music', 'Journaling']
        alex_profile.voice_preference = 'calm-female'
        alex_profile.is_onboarded = True
        alex_profile.is_email_verified = True
        alex_profile.save()

        # 2. Create sarah_engineer
        sarah = User.objects.create(
            username='sarah_engineer',
            email='sarah.engineer@example.com',
            is_active=True
        )
        sarah.set_password('Password123!')
        sarah.save()

        sarah_profile, _ = UserProfile.objects.get_or_create(user=sarah)
        sarah_profile.occupation = 'Working Professional'
        sarah_profile.sleep_hours = 7.0
        sarah_profile.exercise_frequency = '3–4 Days'
        sarah_profile.screen_time = 9.0
        sarah_profile.water_intake = 2.5
        sarah_profile.goals = ['Reduce Stress', 'Improve Work-Life Balance', 'Build Healthy Habits']
        sarah_profile.coping_methods = ['Meditation', 'Exercise', 'Reading', 'Stretching']
        sarah_profile.voice_preference = 'deep-male'
        sarah_profile.is_onboarded = True
        sarah_profile.is_email_verified = True
        sarah_profile.save()

        # Dates setup (30 days ending today)
        today = timezone.now().date()
        date_list = [today - timedelta(days=i) for i in range(29, -1, -1)]

        # Get activities references
        activities = {act.id: act for act in TherapyActivity.objects.all()}

        self.stdout.write("Generating data for alex_student...")
        self.seed_alex(alex, date_list, activities)

        self.stdout.write("Generating data for sarah_engineer...")
        self.seed_sarah(sarah, date_list, activities)

        # Update streaks at the end
        from mood.services import MoodService
        alex_profile.refresh_from_db()
        alex_profile.streak = MoodService.calculate_streak(alex, today=today)
        alex_profile.save()

        sarah_profile.refresh_from_db()
        sarah_profile.streak = MoodService.calculate_streak(sarah, today=today)
        sarah_profile.save()

        self.stdout.write(self.style.SUCCESS("Successfully seeded demo data for both profiles."))

    def seed_alex(self, user, date_list, activities):
        # Alex's story:
        # Day 0-9: Stressed about final assignments, mild-to-moderate school anxiety
        # Day 10-14: Starts breathing and walking, mood improves
        # Day 15-20: Midterm exams week, sleep drops, stress rises, mood drops
        # Day 21-29: Recovering and final assignments finished, feeling happy
        
        mood_labels = {1: 'Terrible', 2: 'Bad', 3: 'Neutral', 4: 'Good', 5: 'Excellent'}

        alex_journals = [
            # Days 0-9
            "I feel so overwhelmed by my university Assignments. I have three papers due next week and I don't know how I will finish.",
            "Couldn't sleep well tonight. Kept thinking about my calculus essay. My energy level is super low today.",
            "Spent the entire day sitting in the library trying to study. I drank too much coffee and my stress is through the roof.",
            "Had a small argument with my project partner. They are not doing their share, which adds to my academic stress.",
            "Tried a quick breathing exercise in the afternoon. It helped a little bit, but the anxiety is still present.",
            "Woke up with an intense headache. Too much screen time studying. I need to take a break from my laptop.",
            "Went for a short walk around the campus. The crisp air felt good, but I am still stressed about my exams.",
            "Socialized a bit with my classmates. It was nice to talk to someone, but I feel guilty about not studying.",
            "It is Sunday and I haven't done enough work. The panic of the upcoming exam week is building up.",
            "Calculus class was really difficult. I felt lost. Hopefully, the study group tomorrow will help me.",
            # Days 10-14
            "The study group went surprisingly well. I feel a bit more confident and slightly less anxious today.",
            "Tried the Box Breathing exercise. It really helped calm down my racing thoughts before bedtime.",
            "Feeling more focused today. I managed to complete one of my term papers. It feels like a big weight off my shoulders.",
            "Had a good conversation with my professor during office hours. They gave me an extension on my chemistry assignment.",
            "Went to the gym for a light workout. My physical energy is higher and I slept much better.",
            # Days 15-20 (Midterms)
            "First day of midterm exams. I am absolutely exhausted. Barely slept 4 hours last night. So nervous.",
            "Midterms are in full swing. I'm feeling completely drained and super stressed. Had a minor panic moment during physics.",
            "Spent the last 15 hours studying. My eyes hurt from looking at slides. The pressure is intense.",
            "I feel like I failed today's math exam. It is hard to stay positive. Just want this exam week to be over.",
            "Too tired to cook or even clean. I just ate instant noodles. Feeling very lonely and burnt out.",
            "Last exam is tomorrow. I can see the light at the end of the tunnel, but today is the hardest push.",
            # Days 21-29
            "Finally finished! The exams are done and I feel incredibly relieved. My mind is finally free.",
            "Slept for 10 hours straight. I feel so refreshed. Woke up feeling peaceful and happy.",
            "Catching up with my friends. We went out for lunch and laughed a lot. Feeling very connected.",
            "Reorganized my bedroom and got some sunlight. Working on rebuilding my healthy habits.",
            "Started reading a book just for fun, not for class. It is so nice to have free time.",
            "Feeling calm and centered. The ocean breeze walk I took today was really grounding.",
            "Prepared a healthy meal. I have been drinking more water and screen time is down. Keeping up the good work.",
            "I feel very productive and my sleep quality has improved significantly over the last few days.",
            "Woke up today with a clear head. Ready for the next semester. Feeling very hopeful and balanced."
        ]

        # In case the dates list length is different, pad journals
        alex_journals += [alex_journals[-1]] * (len(date_list) - len(alex_journals))

        for idx, date_val in enumerate(date_list):
            dt = timezone.make_aware(datetime.combine(date_val, datetime.min.time()) + timedelta(hours=9))
            
            # Story phases
            if idx <= 9:
                mood = random.choice([2, 3])
                stress = random.randint(7, 8)
                energy = random.randint(3, 5)
                sleep = random.choice([5.5, 6.0, 6.2])
                productivity = random.randint(3, 5)
                social = random.randint(3, 5)
                notes = "Stressed about assignments. Head hurts occasionally."
                sentiment, primary_emo = "Negative", "Anxiety"
                act_id = "act-1" # Box Breathing
            elif idx <= 14:
                mood = random.choice([3, 4])
                stress = random.randint(4, 6)
                energy = random.randint(5, 7)
                sleep = random.choice([6.5, 6.8, 7.0])
                productivity = random.randint(6, 7)
                social = random.randint(5, 7)
                notes = "Started practicing breathing exercises and getting gym time."
                sentiment, primary_emo = "Positive", "Hope"
                act_id = "act-10" # Mindful Walking (Wait, exists in seed_activities)
            elif idx <= 20:
                mood = random.choice([1, 2])
                stress = random.randint(9, 10)
                energy = random.randint(2, 3)
                sleep = random.choice([4.0, 4.5, 5.0])
                productivity = random.randint(4, 6)
                social = random.randint(1, 2)
                notes = "Midterms exam week. Exhausted, skipped meals."
                sentiment, primary_emo = "Negative", "Exhaustion"
                act_id = "act-4" # Physiological Sigh
            else:
                mood = random.choice([4, 5])
                stress = random.randint(1, 3)
                energy = random.randint(7, 8)
                sleep = random.choice([7.2, 7.5, 8.0])
                productivity = random.randint(7, 9)
                social = random.randint(7, 9)
                notes = "Exams are finished. Getting plenty of rest and catching up with friends."
                sentiment, primary_emo = "Positive", "Joy"
                act_id = "act-8" # Zen Counting

            # Save mood log
            mood_log = MoodLog.objects.create(
                user=user,
                date=date_val,
                mood=mood,
                mood_label=mood_labels[mood],
                stress=stress,
                energy=energy,
                sleep=sleep,
                productivity=productivity,
                social=social,
                notes=notes
            )
            MoodLog.objects.filter(pk=mood_log.pk).update(created_at=dt, updated_at=dt)

            # Create Journal & Emotion Analysis
            analysis_json = {
                "sentiment": sentiment,
                "emotion": primary_emo,
                "confidence": round(random.uniform(0.85, 0.96), 2),
                "themes": ["Academic Stress" if idx <= 20 else "Relaxation", "Health"],
                "crisisStatus": "Safe"
            }
            entry = JournalEntry.objects.create(
                user=user,
                text=alex_journals[idx],
                is_voice=(idx % 7 == 0),
                analysis=analysis_json
            )
            JournalEntry.objects.filter(pk=entry.pk).update(created_at=dt, updated_at=dt)

            ea = EmotionAnalysis.objects.create(
                journal_entry=entry,
                primary_emotion=primary_emo,
                confidence=analysis_json["confidence"]
            )
            EmotionAnalysis.objects.filter(pk=ea.pk).update(created_at=dt)

            # Create Activity Feedback & Recommendation on alternating days
            if idx % 2 == 0:
                is_completed = True
                curr_act_id = act_id
                if idx == 6:
                    curr_act_id = "act-8"  # Zen Counting ignores under heavy burden/stress
                    is_completed = False
                
                act = activities.get(curr_act_id)
                if act:
                    satisfaction = random.choice([4, 5]) if mood >= 3 else random.choice([2, 3])
                    mood_improved = "Yes" if mood >= 3 else "A Little"
                    
                    if is_completed:
                        feedback = ActivityFeedback.objects.create(
                            user=user,
                            activity=act,
                            duration_minutes=random.choice([5, 10, 15]),
                            satisfaction=satisfaction,
                            mood_improved=mood_improved
                        )
                        ActivityFeedback.objects.filter(pk=feedback.pk).update(date=date_val, created_at=dt, updated_at=dt)
                    
                    rec_theme = "Academic Stress" if idx <= 20 else "Relaxation"
                    rec_trigger = alex_journals[idx][:200]
                    reasons = [
                        f"Your journal indicates {rec_theme.lower()} concerns.",
                        f"Found similar journal entries in the past.",
                        f"Recommended to support your university study balance."
                    ]
                    if is_completed:
                        reasons.append(f"You completed this activity successfully and rated it {satisfaction}/5.")
                    else:
                        reasons.append("Ignored in your recent session, suggesting alternative exploration.")
                    
                    mood_before = mood
                    mood_after = min(5, mood + 1) if (is_completed and mood_improved == "Yes") else mood
                    impr_score = 2.0 if (is_completed and mood_improved == "Yes") else 0.0
                    
                    conf_val = round(random.uniform(0.85, 0.95), 2) if is_completed else 0.60
                    score_val = round(random.uniform(75.0, 95.0), 1) if is_completed else 45.0
                    
                    rec = Recommendation.objects.create(
                        user=user,
                        activity=act,
                        reason=" ".join(reasons),
                        is_active=(date_val == date_list[-1]),
                        trigger=rec_trigger,
                        journal_theme=rec_theme,
                        mood=mood_before,
                        stress=stress,
                        completed=is_completed,
                        user_rating=satisfaction if is_completed else None,
                        mood_before=mood_before,
                        mood_after=mood_after if is_completed else None,
                        improvement_score=impr_score,
                        score=score_val,
                        confidence=conf_val,
                        reasons_list=reasons
                    )
                    Recommendation.objects.filter(pk=rec.pk).update(created_at=dt, updated_at=dt)

            # Daily Prediction forecasting next day's mood
            predicted_mood = min(5, max(1, mood + random.choice([-1, 0, 1])))
            pred = MoodPrediction.objects.create(
                user=user,
                predicted_mood=predicted_mood,
                confidence=round(random.uniform(0.7, 0.9), 2),
                reasons=[f"Calculated from your {primary_emo} emotion markers and sleep baseline of {sleep} hours."]
            )
            MoodPrediction.objects.filter(pk=pred.pk).update(created_at=dt)

            # Weekly AI Insight
            if idx in [7, 14, 21, 28]:
                insight = AIInsight.objects.create(
                    user=user,
                    summary=f"Weekly Summary: You have logged {idx} check-ins. Your overall emotional twin trends suggest strong correlation between low sleep ("
                            f"below 6 hours) and high stress markers. Practice somatic box breathing during high-stress hours."
                )
                AIInsight.objects.filter(pk=insight.pk).update(created_at=dt)

    def seed_sarah(self, user, date_list, activities):
        # Sarah's story:
        # Day 0-9: Work pressure, bad backlog delays, high stress, low sleep
        # Day 10-18: Starts yoga, somatic stretching, and audio meditation, sleep recovers
        # Day 19-24: Big release week, minor work setback, sleep drops slightly
        # Day 25-29: Post-release relaxation, weekend trip, feeling great and balanced
        
        mood_labels = {1: 'Terrible', 2: 'Bad', 3: 'Neutral', 4: 'Good', 5: 'Excellent'}

        sarah_journals = [
            # Days 0-9
            "Work was incredibly stressful today. We have a production release delay and everyone is blaming our team.",
            "Exhausted from compiling error logs. My back hurts from sitting in my chair all day. I need some relief.",
            "Woke up at 3 AM thinking about a bug in the code. I couldn't go back to sleep. Work anxiety is getting to me.",
            "Had back-to-back status meetings. Felt like a waste of energy. My productivity is suffering.",
            "Tried coding for 8 hours without a break. Woke up feeling super tense and irritated.",
            "My sleep was horrible. I keep drinking energy drinks, which makes me feel jittery and nervous.",
            "Felt completely overwhelmed during the team standup. Too much work on my plate.",
            "Spent the weekend thinking about the backlog. Didn't relax at all. Stress levels are extremely high.",
            "Had a productive coding session, but my shoulders are very stiff. Need to do some somatic stretching.",
            "I feel very disconnected from my team today. Everyone is working remotely and it feels isolating.",
            # Days 10-18
            "Tried a 10-minute yoga stretching routine today. It really helped release tension in my upper back.",
            "Woke up feeling more balanced. I decided to turn off work notifications after 6 PM.",
            "Decided to do a zen counting meditation. It helped clear my head of database queries.",
            "Worked from a local coffee shop for a change of scene. Helped my productivity and felt more positive.",
            "Great sleep last night. I am starting to feel like myself again. Yoga is really making a difference.",
            "Completed a hatha yoga session in the morning. My mind is calmer and my posture feels better.",
            "No work thoughts tonight. Cooked a nice dinner and watched a movie. Felt so relaxed.",
            "Highly focused today and closed three pending engineering issues. Celebrating small wins.",
            "A nice quiet weekend. Took a long walk in the park and read a book. My energy is returning.",
            # Days 19-24 (Release Week)
            "The release week has started. Feeling the pressure build up again, but trying to stay centered.",
            "A blocker bug was found in production. Had to stay online until late. Slept poorly.",
            "Still debugging the performance issue. Stress is high, but I am taking breathing breaks.",
            "Production hotfix successfully deployed. Huge relief. Still tired but the emergency is over.",
            "Cleaning up post-release tasks. Ready for a well-deserved weekend rest.",
            # Days 25-29
            "I am taking a personal day off today. Went to a spa, disconnected my phone. Absolutely bliss.",
            "Spent the day outdoors hiking. The nature views were so grounding. Emotionally very peaceful.",
            "Had a great brunch with friends. Socializing helped recharge my emotional batteries.",
            "Woke up with zero stress. Practiced mindfulness. Enjoying the calm tempo of the day.",
            "Ready to head back to work tomorrow. I now have the coping skills to handle the pressure.",
            "Woke up early, drank water, stretched, and logged a positive entry. Feeling very balanced."
        ]

        # Pad journals if dates list length differs
        sarah_journals += [sarah_journals[-1]] * (len(date_list) - len(sarah_journals))

        for idx, date_val in enumerate(date_list):
            dt = timezone.make_aware(datetime.combine(date_val, datetime.min.time()) + timedelta(hours=9))
            
            # Story phases
            if idx <= 9:
                mood = random.choice([2, 3])
                stress = random.randint(7, 9)
                energy = random.randint(4, 5)
                sleep = random.choice([5.8, 6.0, 6.4])
                productivity = random.randint(4, 6)
                social = random.randint(2, 4)
                notes = "Heavy database project pressure, stiff shoulders."
                sentiment, primary_emo = "Negative", "Stress"
                act_id = "act-25" # Vagus Nerve Hatha Yoga
            elif idx <= 18:
                mood = random.choice([3, 4])
                stress = random.randint(3, 5)
                energy = random.randint(6, 8)
                sleep = random.choice([7.0, 7.2, 7.5])
                productivity = random.randint(7, 8)
                social = random.randint(5, 7)
                notes = "Doing yoga morning stretching, work boundaries enforced."
                sentiment, primary_emo = "Positive", "Calm"
                act_id = "act-25" # Vagus Nerve Hatha Yoga
            elif idx <= 23:
                mood = random.choice([2, 3])
                stress = random.randint(7, 8)
                energy = random.randint(5, 6)
                sleep = random.choice([6.0, 6.2])
                productivity = random.randint(6, 8)
                social = random.randint(3, 4)
                notes = "Production release week, long hotfix sessions."
                sentiment, primary_emo = "Negative", "Overwhelm"
                act_id = "act-2" # 4-7-8 Breathing
            else:
                mood = random.choice([4, 5])
                stress = random.randint(1, 2)
                energy = random.randint(8, 9)
                sleep = random.choice([7.8, 8.0, 8.2])
                productivity = random.randint(7, 9)
                social = random.randint(8, 9)
                notes = "Post-release vacation days, feeling extremely refreshed."
                sentiment, primary_emo = "Positive", "Joy"
                act_id = "act-26" # Brisk Mindful Walk

            # Save mood log
            mood_log = MoodLog.objects.create(
                user=user,
                date=date_val,
                mood=mood,
                mood_label=mood_labels[mood],
                stress=stress,
                energy=energy,
                sleep=sleep,
                productivity=productivity,
                social=social,
                notes=notes
            )
            MoodLog.objects.filter(pk=mood_log.pk).update(created_at=dt, updated_at=dt)

            # Create Journal & Emotion Analysis
            analysis_json = {
                "sentiment": sentiment,
                "emotion": primary_emo,
                "confidence": round(random.uniform(0.85, 0.98), 2),
                "themes": ["Work Pressure" if idx <= 23 else "Leisure", "Mindfulness"],
                "crisisStatus": "Safe"
            }
            entry = JournalEntry.objects.create(
                user=user,
                text=sarah_journals[idx],
                is_voice=(idx % 6 == 0),
                analysis=analysis_json
            )
            JournalEntry.objects.filter(pk=entry.pk).update(created_at=dt, updated_at=dt)

            ea = EmotionAnalysis.objects.create(
                journal_entry=entry,
                primary_emotion=primary_emo,
                confidence=analysis_json["confidence"]
            )
            EmotionAnalysis.objects.filter(pk=ea.pk).update(created_at=dt)

            # Create Activity Feedback & Recommendation
            if idx % 2 == 0:
                is_completed = True
                curr_act_id = act_id
                if idx == 4:
                    is_completed = False  # Ignore Yoga to demonstrate ignored recommendation logic
                
                act = activities.get(curr_act_id)
                if act:
                    satisfaction = random.choice([4, 5]) if mood >= 3 else random.choice([3, 4])
                    mood_improved = "Yes" if mood >= 3 else "A Little"
                    
                    if is_completed:
                        feedback = ActivityFeedback.objects.create(
                            user=user,
                            activity=act,
                            duration_minutes=random.choice([10, 15, 20]),
                            satisfaction=satisfaction,
                            mood_improved=mood_improved
                        )
                        ActivityFeedback.objects.filter(pk=feedback.pk).update(date=date_val, created_at=dt, updated_at=dt)
                    
                    rec_theme = "Work Pressure" if idx <= 23 else "Leisure"
                    rec_trigger = sarah_journals[idx][:200]
                    reasons = [
                        f"Your journal indicates {rec_theme.lower()} concerns.",
                        f"Found similar journal entries in the past.",
                        f"Recommended to support your remote work boundaries."
                    ]
                    if is_completed:
                        reasons.append(f"You completed this activity successfully and rated it {satisfaction}/5.")
                    else:
                        reasons.append("Ignored in your recent session, suggesting alternative exploration.")
                    
                    mood_before = mood
                    mood_after = min(5, mood + 1) if (is_completed and mood_improved == "Yes") else mood
                    impr_score = 2.0 if (is_completed and mood_improved == "Yes") else 0.0
                    
                    conf_val = round(random.uniform(0.85, 0.95), 2) if is_completed else 0.60
                    score_val = round(random.uniform(75.0, 95.0), 1) if is_completed else 45.0
                    
                    rec = Recommendation.objects.create(
                        user=user,
                        activity=act,
                        reason=" ".join(reasons),
                        is_active=(date_val == date_list[-1]),
                        trigger=rec_trigger,
                        journal_theme=rec_theme,
                        mood=mood_before,
                        stress=stress,
                        completed=is_completed,
                        user_rating=satisfaction if is_completed else None,
                        mood_before=mood_before,
                        mood_after=mood_after if is_completed else None,
                        improvement_score=impr_score,
                        score=score_val,
                        confidence=conf_val,
                        reasons_list=reasons
                    )
                    Recommendation.objects.filter(pk=rec.pk).update(created_at=dt, updated_at=dt)

            # Daily Prediction
            predicted_mood = min(5, max(1, mood + random.choice([-1, 0, 1])))
            pred = MoodPrediction.objects.create(
                user=user,
                predicted_mood=predicted_mood,
                confidence=round(random.uniform(0.7, 0.92), 2),
                reasons=[f"Inferred from your daily {primary_emo} emotion patterns and sleep metric showing {sleep} hours."]
            )
            MoodPrediction.objects.filter(pk=pred.pk).update(created_at=dt)

            # Weekly AI Insight
            if idx in [7, 14, 21, 28]:
                insight = AIInsight.objects.create(
                    user=user,
                    summary=f"Weekly Summary: Your work-life balance shows improvement. Sleep has stabilized from {sleep} hours, corresponding with lower reported stress levels. Keep prioritizing yoga and park walks on busy days."
                )
                AIInsight.objects.filter(pk=insight.pk).update(created_at=dt)
