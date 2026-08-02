from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from users.models import UserProfile
from assessment.models import AssessmentResponse

User = get_user_model()

class AssessmentAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser', 
            email='test@example.com', 
            password='Password123!'
        )
        self.client.force_authenticate(user=self.user)
        self.profile, _ = UserProfile.objects.get_or_create(user=self.user)
        
        self.payload = {
            "demographic": {"occupation": "Software Engineer"},
            "baseline": {
                "sleep": 7.5,
                "exercise": "3–4 Days",
                "screenTime": 8.0,
                "water": 2.0
            },
            "goals": ["Reduce Stress"],
            "copingMethods": ["Exercise"]
        }

    def test_post_assessment_success(self):
        url = reverse('assessment_root')
        response = self.client.post(url, self.payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify db update
        self.profile.refresh_from_db()
        self.assertTrue(self.profile.is_onboarded)
        self.assertEqual(self.profile.occupation, "Software Engineer")
        self.assertEqual(float(self.profile.sleep_hours), 7.5)
        
        # Verify assessment response exists
        self.assertTrue(AssessmentResponse.objects.filter(user=self.user).exists())

    def test_post_assessment_prevent_duplicate(self):
        # Set onboarded to True
        self.profile.is_onboarded = True
        self.profile.save()
        
        url = reverse('assessment_root')
        response = self.client.post(url, self.payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Assessment has already been completed.", response.data['error'])

    def test_retake_assessment(self):
        # Set onboarded to True
        self.profile.is_onboarded = True
        self.profile.save()
        
        url = reverse('assessment_retake')
        response = self.client.post(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.profile.refresh_from_db()
        self.assertFalse(self.profile.is_onboarded)
