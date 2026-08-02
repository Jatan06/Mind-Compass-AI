from django.test import TestCase
from django.core.management import call_command
from activities.models import TherapyActivity

class SeedActivitiesCommandTestCase(TestCase):
    def test_seed_activities_command(self):
        # Verify db is empty of pre-seeded activities in test context
        self.assertEqual(TherapyActivity.objects.count(), 0)
        
        # Execute the seed command
        call_command('seed_activities')
        
        # Verify all 51 activities were imported
        self.assertEqual(TherapyActivity.objects.count(), 51)
        
        # Verify fields and formatting of a sample activity
        breathe = TherapyActivity.objects.get(id='act-1')
        self.assertEqual(breathe.title, "Box Breathing")
        self.assertEqual(breathe.category, "Breathing")
        self.assertEqual(breathe.duration, "5 min")
        self.assertEqual(breathe.difficulty, "Beginner")
        self.assertIn("Clinical Purpose:", breathe.description)
        self.assertIn("Evidence Level:", breathe.description)
        self.assertIn("Inhale slowly through your nose", breathe.instructions[1])
        
        # Re-run command to test idempotency
        call_command('seed_activities')
        
        # Count should remain 51, indicating no duplicate rows
        self.assertEqual(TherapyActivity.objects.count(), 51)
