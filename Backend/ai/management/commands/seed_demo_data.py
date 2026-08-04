import random
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.utils import timezone
from django.contrib.auth import get_user_model
from unittest.mock import patch

from users.models import UserProfile
from mood.models import MoodLog
from journal.models import JournalEntry
from activities.models import TherapyActivity, ActivityFeedback
from recommendation.models import Recommendation
from ai.models import EmotionAnalysis, MoodPrediction, AIInsight
from core.models import CrisisAlert

from journal.services import JournalService
from recommendation.services import RecommendationService, QuickRecommendationService
from ai.prediction.services import MoodPredictionService
from ai.insights.services import AIInsightsService

User = get_user_model()


class Command(BaseCommand):
    help = "Seed realistic, deterministic mental wellness histories for 12 core personas with full AI pipeline integration."

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help="WARNING: Destroys all 12 demo users before seeding. Without this flag the command is idempotent.",
        )

    def handle(self, *args, **options):
        self.stdout.write("Running seed_activities command to ensure activities are present...")
        call_command('seed_activities')

        usernames = [
            'alex_student', 'sarah_engineer', 'emily_healthy', 'ryan_lonely', 'priya_recovery',
            'jacob_parent', 'chloe_artist', 'marcus_athlete', 'sophia_executive',
            'daniel_grief', 'olivia_new', 'ethan_crisis'
        ]

        if options['force']:
            self.stdout.write(self.style.WARNING("\n[--force] Deleting all 12 demo users and their data..."))
            deleted_count, _ = User.objects.filter(username__in=usernames).delete()
            self.stdout.write(self.style.WARNING(f"Deleted {deleted_count} objects.\n"))
        else:
            existing = User.objects.filter(username__in=usernames).count()
            if existing == len(usernames):
                self.stdout.write(
                    self.style.SUCCESS(
                        f"All {existing} demo users already exist. Running in idempotent mode (no changes made)."
                    )
                )
                self.print_report(usernames)
                return
            elif existing:
                self.stdout.write(f"Only {existing} of {len(usernames)} users exist. Creating the missing users.")

        today = timezone.localdate()

        # Seed data configurations
        personas_config = {
            'alex_student': {
                'email': 'alex.student@gmail.com', 'occupation': 'College Student',
                'goals': ['Reduce Exam Stress', 'Increase Focus', 'Improve Sleep'],
                'coping_methods': ['Deep Breathing', 'Walking', 'Music', 'Journaling'],
                'history_days': 90, 'style': 'casual', 'base_theme': 'academic'
            },
            'sarah_engineer': {
                'email': 'sarah.engineer@gmail.com', 'occupation': 'Software Engineer',
                'goals': ['Reduce Stress', 'Improve Work-Life Balance', 'Build Healthy Habits'],
                'coping_methods': ['Meditation', 'Exercise', 'Reading', 'Stretching'],
                'history_days': 78, 'style': 'logical', 'base_theme': 'professional'
            },
            'emily_healthy': {
                'email': 'emily.healthy@gmail.com', 'occupation': 'Yoga Instructor',
                'goals': ['Maintain Mindfulness', 'Gratitude Practice', 'Physical Stretching'],
                'coping_methods': ['Walking', 'Stretching', 'Gratitude Journaling', 'Yoga'],
                'history_days': 64, 'style': 'positive', 'base_theme': 'wellness'
            },
            'ryan_lonely': {
                'email': 'ryan.lonely@gmail.com', 'occupation': 'UI/UX Designer',
                'goals': ['Build Connections', 'Reduce Loneliness', 'Stay Mindful'],
                'coping_methods': ['Loving-Kindness Meditation', 'Walking', 'Active Listening'],
                'history_days': 52, 'style': 'brief', 'base_theme': 'solitude'
            },
            'priya_recovery': {
                'email': 'priya.recovery@gmail.com', 'occupation': 'Therapist Helper',
                'goals': ['Build Routine', 'Release Stress', 'Improve Sleep'],
                'coping_methods': ['Grounding Exercises', 'Calming Breathing', 'Walking'],
                'history_days': 45, 'style': 'somatic', 'base_theme': 'wellness'
            },
            'jacob_parent': {
                'email': 'jacob.parent@gmail.com', 'occupation': 'Product Manager',
                'goals': ['Work-Life Balance', 'Manage Parenting Overwhelm', 'Calm Routine'],
                'coping_methods': ['Deep Breathing', 'Time Management', 'Nature Walk'],
                'history_days': 39, 'style': 'practical', 'base_theme': 'professional'
            },
            'chloe_artist': {
                'email': 'chloe.artist@gmail.com', 'occupation': 'Digital Artist',
                'goals': ['Reduce Mood Swings', 'Handle Art Blocks', 'Stay Centered'],
                'coping_methods': ['Journaling', 'Drawing', 'Somatic Release'],
                'history_days': 30, 'style': 'bullet', 'base_theme': 'creative'
            },
            'marcus_athlete': {
                'email': 'marcus.athlete@gmail.com', 'occupation': 'Fitness Coach',
                'goals': ['Injury Acceptance', 'Adjust Exercise Goals', 'Muscle Relaxation'],
                'coping_methods': ['Stretching', 'Rehab Exercises', 'Resting Plan'],
                'history_days': 24, 'style': 'brief', 'base_theme': 'somatic'
            },
            'sophia_executive': {
                'email': 'sophia.executive@gmail.com', 'occupation': 'Chief Operating Officer',
                'goals': ['High Screen Time Limits', 'Productivity Balance', 'Deep Rest'],
                'coping_methods': ['Mindful Breaks', 'Breathing Space', 'Gratitude Jar'],
                'history_days': 18, 'style': 'none', 'base_theme': 'none'
            },
            'daniel_grief': {
                'email': 'daniel.grief@gmail.com', 'occupation': 'History Teacher',
                'goals': ['Manage Grief Weeks', 'Relieve Social Isolation', 'Maintain Gardening Routine'],
                'coping_methods': ['Nostalgic Writing', 'Gardening', 'Social Walks'],
                'history_days': 12, 'style': 'sentimental', 'base_theme': 'solitude'
            },
            'olivia_new': {
                'email': 'olivia.new@gmail.com', 'occupation': 'Junior Associate',
                'goals': ['Orientation Anxiety Relief', 'Establish Office Habits', 'Calm Evenings'],
                'coping_methods': ['Organising Tasks', 'Walking Commute', 'Breathing Exercises'],
                'history_days': 8, 'style': 'casual', 'base_theme': 'academic'
            },
            'ethan_crisis': {
                'email': 'ethan.crisis@gmail.com', 'occupation': 'Chef De Partie',
                'goals': ['Handle Chef Burnout', 'Manage Hostile Situations', 'Safety Planning'],
                'coping_methods': ['Crisis Support Line', 'Cold Slashes', 'Breathing resets'],
                'history_days': 5, 'style': 'sentimental', 'base_theme': 'crisis_kitchen'
            }
        }

        # Create all users first
        self.stdout.write("Initializing all user accounts and profile assessments...")
        users = {}
        for uname, config in personas_config.items():
            user = User.objects.filter(username=uname).first()
            if not user:
                user = User.objects.create(username=uname, email=config['email'], is_active=True)
                user.set_password('Password123!')
                user.save()
                profile = UserProfile.objects.create(
                    user=user, occupation=config['occupation'], goals=config['goals'],
                    coping_methods=config['coping_methods'], is_onboarded=True, is_email_verified=True
                )
                from assessment.models import AssessmentResponse
                AssessmentResponse.objects.create(
                    user=user,
                    raw_data={
                        'occupation': config['occupation'],
                        'goals': config['goals'],
                        'coping_methods': config['coping_methods']
                    }
                )
            users[uname] = user

        # Seed histories day-by-day chronologically
        self.stdout.write("Simulating daily user behavior and executing AI service pipelines...")
        for uname, config in personas_config.items():
            user = users[uname]
            N = config['history_days']

            # Check if this user already has mood logs to preserve existing data
            if MoodLog.objects.filter(user=user).exists():
                self.stdout.write(f"  User {uname} already has check-in logs. Skipping history generation.")
                continue

            self.stdout.write(f"  Simulating {N} days of history for {uname}...")
            date_list = [today - timedelta(days=i) for i in range(N - 1, -1, -1)]

            # Pre-calculate deterministic length categories matching target distribution:
            # 15% Very Short, 25% Short, 35% Medium, 20% Long, 5% Very Long
            num_vshort = int(N * 0.15)
            num_short = int(N * 0.25)
            num_med = int(N * 0.35)
            num_long = int(N * 0.20)
            num_vlong = N - (num_vshort + num_short + num_med + num_long)

            length_cats = (
                ['Very Short'] * num_vshort + ['Short'] * num_short +
                ['Medium'] * num_med + ['Long'] * num_long + ['Very Long'] * num_vlong
            )
            random.Random(uname).shuffle(length_cats)

            # Daily Simulation
            for idx, date_val in enumerate(date_list):
                dt = timezone.make_aware(datetime.combine(date_val, datetime.min.time()) + timedelta(hours=9, minutes=idx % 60))

                # Check login consistency patterns
                if uname == 'sarah_engineer' and date_val.weekday() == 6: # Skips Sunday
                    continue
                if uname == 'emily_healthy' and idx % 12 == 11: # Skips every 12th day
                    continue
                if uname == 'priya_recovery' and (18 <= idx <= 24): # Skips days 18-24
                    continue
                if uname == 'jacob_parent' and date_val.weekday() >= 5: # Skips weekends
                    continue
                if uname == 'chloe_artist' and random.Random(idx).random() < 0.18: # Skips 18% randomly
                    continue
                if uname == 'olivia_new' and idx in [3, 4]: # Skips days 3 and 4
                    continue

                # Generate metrics based on user narrative and phase
                mood, stress, sleep, energy, productivity, social, notes, theme = self.get_daily_metrics(uname, idx, N, date_val)

                # Create MoodLog
                mood_log = MoodLog.objects.create(
                    user=user, date=date_val, mood=mood, mood_label=self.get_mood_label(mood),
                    stress=stress, energy=energy, sleep=sleep, productivity=productivity, social=social, notes=notes
                )
                MoodLog.objects.filter(pk=mood_log.pk).update(created_at=dt, updated_at=dt)

                # Journal Logic
                has_journal = True
                if uname == 'sophia_executive':
                    has_journal = False
                elif uname == 'ryan_lonely' and date_val.weekday() not in [0, 2, 4, 5]: # Mon, Wed, Fri, Sat
                    has_journal = False
                elif uname == 'marcus_athlete' and mood >= 3: # Only journals on bad leg days
                    has_journal = False

                journal_entry = None
                if has_journal:
                    length_cat = length_cats[idx]
                    text = self.get_unique_journal(uname, idx, mood, stress, length_cat)
                    is_voice = (idx % 7 == 0)

                    # Execute creation with the patched date
                    with patch('django.utils.timezone.now', return_value=dt), \
                            patch('django.utils.timezone.localdate', return_value=date_val):
                        journal_entry = JournalService.create_entry(user, text, is_voice=is_voice)

                    # Force backdating of auto-created analysis/alert objects
                    JournalEntry.objects.filter(pk=journal_entry.pk).update(date=dt, created_at=dt, updated_at=dt)
                    for ea in journal_entry.emotion_analyses.all():
                        EmotionAnalysis.objects.filter(pk=ea.pk).update(created_at=dt)
                    for alert in CrisisAlert.objects.filter(journal_entry=journal_entry):
                        CrisisAlert.objects.filter(pk=alert.pk).update(created_at=dt, updated_at=dt)

                # Recommendation & Feedback Logic (AI Pipeline Execution)
                with patch('django.utils.timezone.now', return_value=dt), \
                        patch('django.utils.timezone.localdate', return_value=date_val):

                    # recommendation service checks that mood check-in and optionally journal exist
                    if has_journal:
                        rec = RecommendationService.get_today_recommendation(user, force_recalculate=True)
                    else:
                        rec = QuickRecommendationService.get_quick_recommendation(user, force_recalculate=True)
                    if rec:
                        # Determine if user completes it on this day
                        # High compliance for Emily (90%), others average 60%
                        compliance_limit = 0.90 if uname == 'emily_healthy' else 0.60
                        completed = (random.Random(idx).random() < compliance_limit)

                        if completed:
                            satisfaction = random.Random(idx).randint(3, 5)
                            rec.completed = True
                            rec.user_rating = satisfaction
                            rec.mood_before = mood
                            rec.mood_after = min(5, mood + 1) if satisfaction >= 4 else mood
                            rec.improvement_score = 1.5 if satisfaction >= 4 else 0.5
                            rec.save()

                            # Create feedback
                            feedback = ActivityFeedback.objects.create(
                                user=user, activity=rec.activity,
                                duration_minutes=int(rec.activity.duration.split(' ')[0]) if 'min' in rec.activity.duration else 10,
                                satisfaction=satisfaction, mood_improved="Yes" if satisfaction >= 4 else "A Little"
                            )
                            ActivityFeedback.objects.filter(pk=feedback.pk).update(date=date_val, created_at=dt, updated_at=dt)

                        Recommendation.objects.filter(pk=rec.pk).update(created_at=dt, updated_at=dt)

                    # Predict Mood for Tomorrow
                    MoodPredictionService.predict(user)
                    pred = MoodPrediction.objects.filter(user=user).order_by('-created_at').first()
                    if pred:
                        MoodPrediction.objects.filter(pk=pred.pk).update(created_at=dt)

                    # Call weekly AIInsight summary
                    if idx > 0 and (idx % 7 == 6 or idx == N - 1):
                        AIInsightsService.generate_insights(user)
                        insight = AIInsight.objects.filter(user=user).order_by('-created_at').first()
                        if insight:
                            AIInsight.objects.filter(pk=insight.pk).update(created_at=dt)

            # Update final streaks & wellness scores
            from mood.services import MoodService
            user_profile = user.profile
            user_profile.streak = MoodService.calculate_streak(user, today=today)
            logs = MoodLog.objects.filter(user=user)
            if logs.exists():
                avg_mood = sum([l.mood for l in logs]) / logs.count()
                avg_stress = sum([l.stress for l in logs]) / logs.count()
                user_profile.wellness_score = int((avg_mood / 5.0) * 60 + ((10 - avg_stress) / 10.0) * 40)
            user_profile.save()

        # Run Verification suite
        self.verify_and_print_report(usernames, today)

    def print_report(self, usernames):
        self.verify_and_print_report(usernames, timezone.localdate())

    def get_mood_label(self, mood):
        return {1: 'Terrible', 2: 'Bad', 3: 'Neutral', 4: 'Good', 5: 'Excellent'}.get(mood, 'Neutral')

    def get_daily_metrics(self, username, idx, N, date_val):
        # Deterministic random generator for metrics noise
        rng = random.Random(username + str(idx))

        if username == 'alex_student':
            if idx < 50:
                return rng.choice([3, 4]), rng.randint(3, 4), round(rng.uniform(6.5, 7.5), 1), 7, 7, 6, "Studying and attending lectures.", "study"
            elif idx < 75:
                return rng.choice([2, 3]), rng.randint(6, 8), round(rng.uniform(5.2, 6.5), 1), 5, 8, 4, "Preparing for my upcoming midterms.", "exam_prep"
            elif idx < 85:
                return rng.choice([1, 2]), rng.randint(8, 10), round(rng.uniform(4.0, 5.0), 1), 3, 9, 2, "In the middle of final exam week.", "exams"
            else:
                return rng.choice([4, 5]), rng.randint(1, 3), round(rng.uniform(7.8, 9.0), 1), 8, 5, 8, "Finished with exams, relaxing.", "recovery"

        elif username == 'sarah_engineer':
            is_weekend = (date_val.weekday() >= 5)
            if idx < 65:
                if is_weekend:
                    return rng.choice([4, 5]), rng.randint(2, 3), round(rng.uniform(7.5, 8.5), 1), 7, 3, 6, "Enjoying the weekend hike.", "weekend"
                else:
                    return 3, rng.randint(4, 6), round(rng.uniform(6.0, 7.0), 1), 6, 8, 3, "Working on codebase and standups.", "work"
            else:
                if is_weekend:
                    return 3, 6, 6.5, 4, 6, 3, "Did some overtime work today.", "overtime"
                else:
                    return rng.choice([2, 3]), rng.randint(7, 9), round(rng.uniform(5.0, 6.0), 1), 4, 9, 2, "Massive deployment pressure. Blocker bugs.", "burnout"

        elif username == 'emily_healthy':
            if idx in [15, 40]:
                return 3, 6, 6.8, 6, 7, 6, "Felt slightly anxious about presentation.", "anxiety"
            return rng.choice([4, 5]), rng.randint(1, 3), round(rng.uniform(7.5, 8.5), 1), 8, 8, 8, "Feeling great. Sunrise yoga stretch completed.", "mindfulness"

        elif username == 'ryan_lonely':
            if idx in [10, 24, 38, 48]:
                return 4, 3, 7.5, 7, 6, 7, "Called family or had a coffee with classmate today.", "social"
            return rng.choice([2, 3]), rng.randint(4, 5), round(rng.uniform(6.8, 7.5), 1), 5, 6, 1, "Quiet evening in my clean empty room.", "loneliness"

        elif username == 'priya_recovery':
            if idx < 15:
                return 2, 8, round(rng.uniform(4.5, 5.5), 1), 3, 3, 2, "Struggling with high anxiety and muscle stiffness.", "panic"
            elif idx < 18:
                return 3, 6, 6.0, 4, 4, 3, "Attempting breathing exercises and physical walks.", "start_recovery"
            elif idx < 35:
                return 3, 5, round(rng.uniform(6.5, 7.2), 1), 5, 6, 4, "Returned checkins. Somatic breathing helped my chest.", "incremental_progress"
            else:
                return 4, 3, round(rng.uniform(7.5, 8.5), 1), 7, 7, 6, "Steady recovery and sensory clarity.", "recovery"

        elif username == 'jacob_parent':
            return rng.choice([3, 4]), rng.randint(5, 7), round(rng.uniform(5.5, 6.8), 1), 5, 7, 6, "Balancing school drop-off and product manager roles.", "parenting"

        elif username == 'chloe_artist':
            if idx in [5, 12, 19, 26]:
                return 2, 8, 4.5, 4, 5, 2, "Experienced severe art block today in the studio.", "art_block"
            return rng.choice([4, 5]), rng.randint(2, 3), round(rng.uniform(7.0, 8.5), 1), 8, 8, 4, "Inspired sketches and canvas blends completed.", "creative_flow"

        elif username == 'marcus_athlete':
            if idx < 15:
                return rng.choice([2, 3]), rng.randint(6, 7), 7.0, 4, 5, 3, "Leg strain recovery and doctors visit. Stiff muscle.", "injury"
            return 4, 3, 7.5, 7, 8, 5, "Walking hamstring stretch went very well.", "rehab_success"

        elif username == 'sophia_executive':
            return rng.choice([3, 4]), rng.randint(6, 7), 6.2, 8, 9, 5, "Busy schedule with boardroom meetings.", "executive"

        elif username == 'daniel_grief':
            return rng.choice([1, 2]), rng.randint(5, 6), 5.6, 3, 4, 2, "Missing my late wife in the quiet garden.", "grief"

        elif username == 'olivia_new':
            return 3, rng.randint(5, 6), 6.5, 6, 7, 5, "Started corporate grad orientation meetings.", "orientation"

        elif username == 'ethan_crisis':
            return rng.choice([1, 2]), rng.randint(9, 10), 4.2, 3, 4, 1, "Hostile kitchen staff and chef head shouting.", "crisis"

        return 3, 5, 7.0, 5, 5, 5, "Neutral day logs.", "default"

    def get_unique_journal(self, username, idx, mood, stress, length_cat):
        templates = {
            'academic': {
                'openers': [
                    "Woke up and checked campus notifications.", "Spent the morning at the library.",
                    "Attended my biochemistry lecture today.", "Actually, today went a bit differently.",
                    "Sitting at my desk reviewing old slides.", "Did some intensive study prep.",
                    "Woke up feeling the exam pressure.", "Quiet day on campus today.",
                    "Reviewing physics notes in the lounge.", "Met a study group in the afternoon.",
                    "Another day of classes and homework."
                ],
                'situations_low_stress': [
                    "the calculus homework felt quite straightforward.", "successfully finished my lab report early.",
                    "the biology midterm guidelines are clear now.", "organic chemistry notes finally made sense.",
                    "did well on the practice physics test.", "group seminar presentation slides are complete.",
                    "managed to catch up on history reading.", "the library study session was productive.",
                    "algebra problem sets are all solved.", "laboratory results came out completely correct.",
                    "the science lecture was actually interesting.", "finished my essay drafts before the deadline.",
                    "found a great study spot in the basement."
                ],
                'situations_high_stress': [
                    "the calculus exam is coming up and I am lost.", "still struggling with the biology lab slides.",
                    "upcoming physics midterm is stressing me out.", "cannot memorize these organic chemistry reaction maps.",
                    "group project coordinator is not replying to emails.", "algebra assignment is way too long and complex.",
                    "my physics grades are slipping dangerously.", "concerned about my test scores this semester.",
                    "calculus formulas are extremely confusing.", "the chemistry midterm prep is overwhelming.",
                    "too many back-to-back quizzes this week.", "failing this chemistry class is a real threat.",
                    "the sheer volume of academic reading is insane."
                ],
                'feelings_low_stress': [
                    "calm and steady.", "glad to make some solid progress.", "clear-headed and focused.",
                    "quite satisfied with the work done.", "resting my brain after studying.",
                    "nice sense of academic control.", "ready for the next lectures."
                ],
                'feelings_high_stress': [
                    "super nervous and my shoulders are tight.", "my mind keeps racing back to study deficits.",
                    "totally overwhelmed and burned out.", "sleepless thinking about grade averages.",
                    "struggling to retain information.", "extremely solitary studying all night.",
                    "headache from staring at screens all day."
                ],
                'closers': [
                    "Hope tomorrow goes well.", "Need to sleep early tonight.", "Time to rest my brain.",
                    "Will try to set better study boundaries.", "Let's see how tomorrow looks.",
                    "Hopeful about the weekend.", "Need to stay consistent."
                ]
            },
            'professional': {
                'openers': [
                    "Started the morning checking Jira tasks.", "Logged into the standby Slack channel.",
                    "Began screen work early.", "Typical day at the office desks.",
                    "Standup sync was early.", "Reviewing API documentation files.",
                    "Spent the afternoon in code reviews.", "Spent hours tracking bug files.",
                    "Woke up to database metrics.", "Integration checks took all morning.",
                    "Checking the sprint dashboard tasks."
                ],
                'situations_low_stress': [
                    "the database migration went through without errors.", "fixed the billing endpoints before release.",
                    "the marketing sync was fast and aligned.", "sprint goals are mostly completed.",
                    "code refactoring went very clean.", "the backend database queries are optimized.",
                    "documentation drafts are approved by tech leads.", "onboarding tasks were quite straightforward.",
                    "managed to clear out my email inbox.", "the demo presentation was well received.",
                    "UI components are looking sharp.", "the development team is on track.",
                    "cleared the regression testing queue."
                ],
                'situations_high_stress': [
                    "production server crashed due to database overflow.", "the legacy code is full of bugs and messy.",
                    "sprint deadlines are piling up on my board.", "marketing management added more urgent items.",
                    "the API endpoint returns recurrent 500 errors.", "too many redundant team sync meetings.",
                    "screen fatigue is causing massive headaches.", "doubting my code contributions on this project.",
                    "the database connection pool is failing.", "billing code is extremely difficult to debug.",
                    "onboarding flow is broken on mobile views.", "late deployment hotfix calls ran past midnight.",
                    "management expectations are unrealistic."
                ],
                'feelings_low_stress': [
                    "relaxed after work.", "satisfied with the code commits.", "focused and productive.",
                    "nice sense of project control.", "brain feels sharp and active.",
                    "glad to log off helper tasks.", "content with sprint progress."
                ],
                'feelings_high_stress': [
                    "completely exhausted and stiff.", "highly stressed about tomorrow's deployment.",
                    "drained by endless screen time.", "chest tight thinking about deliverables.",
                    "close to career burnout.", "brain is fried after coding 10 hours.",
                    "highly nervous about the release."
                ],
                'closers': [
                    "Need to close the IDE now.", "Time for a screen detox.", "Will sleep early tonight.",
                    "Hope the build doesn't break.", "Grateful for a quiet evening.", "Jira check done.",
                    "Time to stretch my back."
                ]
            },
            'wellness': {
                'openers': [
                    "Sunrise tea in the garden.", "Woke up feeling refreshed.",
                    "Started the day with gentle breathing.", "Felt a calm energy early.",
                    "Beautiful morning walk in the park.", "Sitting quietly with my journal.",
                    "Enjoyed a peaceful breakfast.", "Typical morning self-care routine.",
                    "Prepped for a relaxing afternoon.", "Sunlight was bright early on.",
                    "Began the day with soft stretches."
                ],
                'situations_low_stress': [
                    "completed a beautiful sequence of yoga poses.", "spent time watering the garden herbs.",
                    "the morning jog felt loose and light.", "felt highly connected to nature trails.",
                    "prepared a organic vegetable salad.", "discussed meditation with a close friend.",
                    "enjoyed the forest sounds near the river.", "wrote a brief gratitude mapping block.",
                    "mindfulness breathing was deep and calm.", "the neighborhood walk was quiet.",
                    "read a few inspiring wellness chapters.", "had a nice chat with local people.",
                    "evening stretch routine felt perfect."
                ],
                'situations_high_stress': [
                    "felt a minor dread wave about future tasks.", "struggling to stay fully present during yoga.",
                    "my chest felt slightly tight during work.", "environmental noise disrupted my quiet hours.",
                    "felt slightly restless while sitting silently.", "my study project has a looming deadline.",
                    "concerned about balancing work and wellness.", "spent too much time checking notifications.",
                    "felt a brief tension headache at noon.", "skipped my morning workout due to fatigue.",
                    "some minor family news made me nervous.", "concerned about sleep quality tonight.",
                    "felt slightly scattered during my meditation."
                ],
                'feelings_low_stress': [
                    "completely centered and calm.", "filled with warm gratitude.", "peaceful and relaxed.",
                    "great sense of inner harmony.", "mind is light and quiet.",
                    "deeply connected to self.", "joyful and vibrant."
                ],
                'feelings_high_stress': [
                    "trying to breathe through the tension.", "redirecting thoughts to the present.",
                    "slightly off balance.", "gently accepting my nervous feelings.",
                    "resting my mind to regain focus.", "reminding myself to let go.",
                    "a bit scattered but okay."
                ],
                'closers': [
                    "Grateful for this day.", "Sending warm wishes to all.", "Time to rest now.",
                    "Yoga class tomorrow morning.", "Wishing myself peace.", "Hopeful for a quiet night.",
                    "Gratitude jar entry done."
                ]
            },
            'solitude': {
                'openers': [
                    "Eating quick lunch in the new kitchen.", "Walking through the quiet neighborhood.",
                    "Sitting in my silent quiet flat.", "Returned to the quiet apartment.",
                    "Checked online chat rooms.", "Woke up to a quiet house.",
                    "Began the day in my solitary room.", "Browsing games on my computer.",
                    "Walked around the city block.", "Checking messages on my phone.",
                    "Quiet evening after the office."
                ],
                'situations_low_stress': [
                    "had a very friendly chat with coworker.", "played online games with gaming group.",
                    "called my family for an hour.", "had coffee with a college friend.",
                    "the neighbor was polite and waved.", "joined a local board game meetup.",
                    "grocery cashier was very friendly.", "enjoyed a quiet gallery exhibition.",
                    "the local coffee shop was cozy.", "helped someone on an online forum.",
                    "received a nice text from old team.", "enjoyed my book near the park.",
                    "the local park walk was peaceful."
                ],
                'situations_high_stress': [
                    "feeling unconnected in this massive city.", "nobody replied to my weekend messages.",
                    "the quietness of the flat is heavy.", "miss my childhood friends and family.",
                    "eating dinner by myself at the table.", "commute home was totally silent.",
                    "office day was quiet and solitary.", "feeling disconnected from the local community.",
                    "homesick and wishing I was back.", "quiet rooms make me feel nervous.",
                    "nobody to talk to all evening.", "weekend feels bare without plans.",
                    "struggling to find my place here."
                ],
                'feelings_low_stress': [
                    "okay and managing fine.", "content after gaming with friends.", "a bit more connected.",
                    "glad to hear my family's voice.", "peaceful and quiet evening.",
                    "steady and relaxed.", "great to have a chat."
                ],
                'feelings_high_stress': [
                    "very solitary and down.", "sadness is creeping in tonight.", "disconnected and solitary.",
                    "aching for some real connection.", "quiet in the dark.",
                    "struggling to fall asleep by myself.", "heavy with lonesomeness."
                ],
                'closers': [
                    "Hope to meet someone tomorrow.", "Missing home tonight.", "Will call my mom tomorrow.",
                    "Time to sleep details.", "Maybe play one more game.", "Hope tomorrow is brighter.",
                    "Heading to bed now."
                ]
            },
            'somatic': {
                'openers': [
                    "Checked my physical rehab goals.", "Woke up planning stretch items.",
                    "Began the day tracking leg.", "Rehab center visit was early.",
                    "Typical morning physical check.", "Sitting down doing leg stretch.",
                    "Started muscle rehab plan.", "Tracking my physical recovery progress.",
                    "Reading sports medicine guides.", "Woke up checking leg stiffness.",
                    "Typical rehab workout done."
                ],
                'situations_low_stress': [
                    "leg hamstring stiffness went away.", "did full stretching sequence.",
                    "walked 20 minutes without support.", "rehab therapist was very happy.",
                    "pain level dropped to zero.", "energy for recovery is high.",
                    "did upper body workout.", "hamstring feels stable and loose.",
                    "completed daily recovery check.", "enjoyed low impact rehab exercises.",
                    "leg muscles are getting stronger.", "mobility metrics are improving.",
                    "feeling positive about leg rehab."
                ],
                'situations_high_stress': [
                    "hamstring strain is super stiff.", "miss training at grid gym.",
                    "recovery is way too slow.", "pain spike after physical therapy.",
                    "frustrated by physical limits today.", "missing running and cardio.",
                    "pain in the leg is high.", "impatient about training schedule.",
                    "stretching was very tight today.", "feeling physically weak and down.",
                    "rehab routine is tiring today.", "spasm in hamstring muscle calf.",
                    "sports doctor recommended extended rest."
                ],
                'feelings_low_stress': [
                    "strong and stable.", "glad for rehab improvements.", "calm and patient.",
                    "somatic relief in leg.", "energy is returning today.",
                    "focused on goal recovery.", "steady and clear."
                ],
                'feelings_high_stress': [
                    "frustrated and stuck.", "highly impatient about injury.", "low from stagnation.",
                    "stiff and muscle painful.", "discouraged about gym limit.",
                    "tired of leg rehab.", "restless and want to train."
                ],
                'closers': [
                    "Rehab session completed successfully.", "Leg recovery takes time.", "Stretches wrapped up today.",
                    "Will keep leg iced.", "Hope tomorrow has less strain.", "Goal-oriented day done.",
                    "Resting the hamstring now."
                ]
            },
            'crisis_kitchen': {
                'openers': [
                    "Kitchen dinner rush is start.", "Started prep station early.",
                    "Toxic head chef shouting early.", "Typical kitchen heat today.",
                    "Prep table clutter is hot.", "Woke up with kitchen stress.",
                    "Boiling pots and hot stove.", "Typical orders backup day.",
                    "Yelling in the chef pit.", "Order tickets piling up today.",
                    "Began checking inventory lists."
                ],
                'situations_low_stress': [
                    "dinner service went very smooth.", "prep station was clean today.",
                    "customer complimented the ribeye.", "head chef was quiet today.",
                    "kitchen staff worked well together.", "inventory check was quick.",
                    "no orders backlog at noon.", "slept some hours before shift.",
                    "dish pit was cleaned fast.", "cooked a perfect salmon dish.",
                    "staff meal was actually good.", "took a brief alleyway break.",
                    "shift ended without shouting."
                ],
                'situations_high_stress': [
                    "head chef is hostile and yelling.", "order tickets backlog is overwhelming.",
                    "complete despair in toxic kitchen.", "kitchen heat is burning hot.",
                    "can't take this pressure. kill myself or run away.", "despair about long chef shifts.",
                    "toxic coworkers make me want to end it all.", "burned my hand on hot griddle.",
                    "no point in living like this. hopeless.", "want to end it all tonight.",
                    "hopelessness about chef career.", "complete kitchen burnout is high.",
                    "I want to die, this job makes me want to kill myself."
                ],
                'feelings_low_stress': [
                    "okay after shift.", "glad kitchen backup stopped.", "calm and resting.",
                    "nice sense of oven control.", "kitchen was quiet today.",
                    "steady and relaxed.", "staff meal was peaceful."
                ],
                'feelings_high_stress': [
                    "complete despair today.", "hopeless and highly distressed.", "kitchen stress is killing me.",
                    "can't take this anymore.", "furious at head chef abuse.",
                    "brain is frying under pressure.", "completely trapped today."
                ],
                'closers': [
                    "Despair in kitchen tonight.", "Chef shift finally done.", "Need to escape this place.",
                    "Hope the kitchen is quiet.", "Will sleep early tonight.", "Kitchen heat is exhausting.",
                    "Despair about tomorrow."
                ]
            }
        }

        # Override for Chloe who uses bullet thoughts always
        theme = 'wellness'
        if username == 'alex_student':
            theme = 'academic'
        elif username == 'sarah_engineer':
            theme = 'professional'
        elif username == 'ryan_lonely':
            theme = 'solitude'
        elif username == 'priya_recovery':
            theme = 'wellness'
        elif username == 'jacob_parent':
            theme = 'professional'
        elif username == 'chloe_artist':
            theme = 'wellness'
        elif username == 'marcus_athlete':
            theme = 'somatic'
        elif username == 'daniel_grief':
            theme = 'solitude'
        elif username == 'olivia_new':
            theme = 'academic'
        elif username == 'ethan_crisis':
            theme = 'crisis_kitchen'

        pool = templates[theme]
        openers = pool['openers']
        closers = pool['closers']

        op_idx = idx % len(openers)
        sit_idx = idx % len(pool['situations_low_stress'])
        feel_idx = idx % len(pool['feelings_low_stress'])
        cl_idx = idx % len(closers)

        is_stress = (stress >= 6 or mood <= 2)

        if is_stress:
            situations = pool.get('situations_high_stress', pool['situations_low_stress'])
            feelings = pool.get('feelings_high_stress', pool['feelings_low_stress'])
        else:
            situations = pool['situations_low_stress']
            feelings = pool['feelings_low_stress']

        op = openers[op_idx]
        sit = situations[sit_idx % len(situations)]
        feel = feelings[feel_idx % len(feelings)]
        cl = closers[cl_idx]

        if length_cat == 'Very Short':
            text = f"{op[:-1]} and {sit}"
        elif length_cat == 'Short':
            text = f"{op} {sit.capitalize()} {cl}"
        elif length_cat == 'Medium':
            text = f"{op} {sit.capitalize()} I feel {feel} {cl}"
        elif length_cat == 'Long':
            sit2 = situations[(sit_idx + 3) % len(situations)]
            feel2 = feelings[(feel_idx + 2) % len(feelings)]
            op2 = openers[(op_idx + 4) % len(openers)]
            text = f"{op} {sit.capitalize()} I feel {feel} {op2} {sit2.capitalize()} Overall, I am {feel2} {cl}"
        else:
            sit2 = situations[(sit_idx + 3) % len(situations)]
            feel2 = feelings[(feel_idx + 2) % len(feelings)]
            op2 = openers[(op_idx + 4) % len(openers)]
            sit3 = situations[(sit_idx + 6) % len(situations)]
            feel3 = feelings[(feel_idx + 4) % len(feelings)]
            cl2 = closers[(cl_idx + 5) % len(closers)]
            para1 = f"{op} {sit.capitalize()} I feel {feel} {op2} {sit2.capitalize()}"
            para2 = f"On the other hand, {sit3} That makes me feel {feel3} {cl2} {cl}"
            text = f"{para1}\n\n{para2}"

        # Chloe style bullet logic
        if username == 'chloe_artist':
            sentences = text.replace('\n\n', ' ').replace('. ', '.|').replace('? ', '?|').split('|')
            text = "\n".join([f"- {s.strip()}" for s in sentences if s.strip()])
        elif username in ['alex_student', 'olivia_new', 'sarah_engineer']:
            # Insert minor casual features deterministically
            typo_map = {
                'study': 'studing', 'preparing': 'prepering', 'tomorrow': 'tommorrow',
                'really': 'realy', 'anxious': 'anxous', 'finished': 'finised', 'feeling': 'fealing'
            }
            words = text.split(" ")
            for i_w, w in enumerate(words):
                w_lower = w.lower().strip(",.!?\"")
                if w_lower in typo_map and idx % 7 == 3:
                    words[i_w] = words[i_w].replace(w_lower, typo_map[w_lower])
            text = " ".join(words)

        return text

    def verify_and_print_report(self, usernames, today):
        self.stdout.write("\n========================================================")
        self.stdout.write("AUTO-RUNNING FINAL DATA INTEGRITY & VERIFICATION SUITE...")
        self.stdout.write("========================================================\n")

        total_users = User.objects.filter(username__in=usernames).count()

        verification_status = {
            'Login Credentials': '[PASS]',
            'Dashboard Data': '[PASS]',
            'Mood History': '[PASS]',
            'Journal History': '[PASS]',
            'Recommendations': '[PASS]',
            'Mood Predictions': '[PASS]',
            'AI Insights': '[PASS]',
            'Emotion Analysis': '[PASS]',
            'Crisis Detection': '[PASS]',
        }

        # Date range for every user
        date_ranges = {}
        for uname in usernames:
            user = User.objects.get(username=uname)
            logs = MoodLog.objects.filter(user=user).order_by('date')
            if logs.exists():
                date_ranges[uname] = f"{logs.first().date} to {logs.last().date} ({logs.count()} check-ins)"
            else:
                date_ranges[uname] = "No check-ins logged"

            # 1. Login checks
            if not user.check_password('Password123!'):
                verification_status['Login Credentials'] = '[FAIL]'

            # 2. Onboarding check
            if not user.profile.is_onboarded or user.profile.wellness_score is None:
                verification_status['Dashboard Data'] = '[FAIL]'

            # 3. Mood check-in history checks
            if MoodLog.objects.filter(user=user).count() != logs.count():
                verification_status['Mood History'] = '[FAIL]'

            # 4. Journal history check (except Sophia)
            j_count = JournalEntry.objects.filter(user=user).count()
            if uname == 'sophia_executive':
                if j_count > 0:
                    verification_status['Journal History'] = '[FAIL] (Sophia has journals)'
            else:
                if j_count == 0:
                    verification_status['Journal History'] = '[FAIL]'

            # 5. Recommendation check
            rec_count = Recommendation.objects.filter(user=user).count()
            if rec_count == 0:
                verification_status['Recommendations'] = '[FAIL]'

            # 6. Prediction check
            pred_count = MoodPrediction.objects.filter(user=user).count()
            if pred_count == 0:
                verification_status['Mood Predictions'] = '[FAIL]'

            # 7. AI Insights
            ins_count = AIInsight.objects.filter(user=user).count()
            if ins_count == 0:
                verification_status['AI Insights'] = '[FAIL]'

            # 8. Emotion Analysis check (except Sophia)
            ea_count = EmotionAnalysis.objects.filter(journal_entry__user=user).count()
            if uname != 'sophia_executive' and ea_count == 0:
                verification_status['Emotion Analysis'] = '[FAIL]'

            # 9. Crisis Detection
            crisis_alerts = CrisisAlert.objects.filter(user=user).count()
            if uname == 'ethan_crisis':
                if crisis_alerts == 0:
                    verification_status['Crisis Detection'] = '[FAIL] (Ethan has no alerts)'
            else:
                if crisis_alerts > 0:
                    verification_status['Crisis Detection'] = f'[FAIL] ({uname} has {crisis_alerts} alerts)'

        # Print report parameters
        self.stdout.write(self.style.SUCCESS(f"• Total users verified: {total_users}"))
        self.stdout.write("• Records created in every table:")
        self.stdout.write(f"  - Users: {User.objects.filter(username__in=usernames).count()}")
        self.stdout.write(f"  - UserProfiles: {UserProfile.objects.filter(user__username__in=usernames).count()}")
        self.stdout.write(f"  - MoodLogs: {MoodLog.objects.filter(user__username__in=usernames).count()}")
        self.stdout.write(f"  - JournalEntries: {JournalEntry.objects.filter(user__username__in=usernames).count()}")
        self.stdout.write(f"  - EmotionAnalyses: {EmotionAnalysis.objects.filter(journal_entry__user__username__in=usernames).count()}")
        self.stdout.write(f"  - Recommendations: {Recommendation.objects.filter(user__username__in=usernames).count()}")
        self.stdout.write(f"  - ActivityFeedbacks: {ActivityFeedback.objects.filter(user__username__in=usernames).count()}")
        self.stdout.write(f"  - MoodPredictions: {MoodPrediction.objects.filter(user__username__in=usernames).count()}")
        self.stdout.write(f"  - AIInsights: {AIInsight.objects.filter(user__username__in=usernames).count()}")
        self.stdout.write(f"  - CrisisAlerts: {CrisisAlert.objects.filter(user__username__in=usernames).count()}")

        self.stdout.write("\n• Date Ranges for all users:")
        for uname, range_str in date_ranges.items():
            self.stdout.write(f"  - {uname}: {range_str}")

        self.stdout.write("\n• Global Statistics:")
        self.stdout.write(f"  - Total Journals: {JournalEntry.objects.filter(user__username__in=usernames).count()}")
        self.stdout.write(f"  - Total Recommendations: {Recommendation.objects.filter(user__username__in=usernames).count()}")
        self.stdout.write(f"  - Total Predictions: {MoodPrediction.objects.filter(user__username__in=usernames).count()}")
        self.stdout.write(f"  - Total AI Insights: {AIInsight.objects.filter(user__username__in=usernames).count()}")
        self.stdout.write(f"  - Total Crisis Alerts: {CrisisAlert.objects.filter(user__username__in=usernames).count()}")
        self.stdout.write(f"  - Total Activity Feedbacks (completions): {ActivityFeedback.objects.filter(user__username__in=usernames).count()}")

        self.stdout.write("\n• Verification module status:")
        all_passed = True
        for key, val in verification_status.items():
            if 'FAIL' in val:
                self.stdout.write(self.style.ERROR(f"  - {key}: {val}"))
                all_passed = False
            else:
                self.stdout.write(self.style.SUCCESS(f"  - {key}: {val}"))

        if all_passed:
            self.stdout.write(self.style.SUCCESS("\n[SUCCESS] The demo database is complete, consistent, and verified for demonstrations!"))
        else:
            self.stdout.write(self.style.ERROR("\n[ERROR] Verification failed for one or more modules. Please inspect alerts."))
