import React from 'react';
import {
    FiCompass,
    FiWind,
    FiActivity,
    FiHeart,
    FiMusic,
    FiMapPin,
    FiMoon,
    FiSun
} from 'react-icons/fi';

export const ACTIVITIES = [
    {
        id: 'act-1',
        title: 'Mindful Breathing',
        category: 'Breathing',
        duration: '5 min',
        durationMinutes: 5,
        difficulty: 'Beginner',
        description: 'A classic box breathing technique to reduce immediately felt stress. Slow down your heart rate and recenter your floating thoughts.',
        benefits: 'Slows down racing thoughts, relaxes tight chest muscles, and lowers cortisol.',
        instructions: [
            'Find a comfortable seated position with your back straight.',
            'Inhale slowly through your nose for a count of 4 seconds.',
            'Hold your breath for a count of 4 seconds.',
            'Exhale slowly and smoothly through your mouth for 4 seconds.',
            'Hold your lungs empty for a count of 4 seconds.',
            'Repeat this cycle 5 times.'
        ],
        icon: <FiWind className="w-5 h-5" />
    },
    {
        id: 'act-2',
        title: 'Calming Lake Meditation',
        category: 'Meditation',
        duration: '10 min',
        durationMinutes: 10,
        difficulty: 'Intermediate',
        description: 'Visualize a peaceful, mirror-like lake to build mental stillness. Excellent for active work breaks or transition periods.',
        benefits: 'Promotes deep visualization skills, enhances emotional stability, and builds calmness.',
        instructions: [
            'Close your eyes and take three deep breaths.',
            'Visualize a perfectly still, blue lake surrounded by mountains at sunrise.',
            'Imagine your thoughts as ripples on the water. Notice them fading away.',
            'Whenever a distraction arises, imagine it sinking to the quiet bottom of the lake.',
            'Allow the silence of the scene to fill your head space.'
        ],
        icon: <FiCompass className="w-5 h-5" />
    },
    {
        id: 'act-3',
        title: 'Gratitude Reflection',
        category: 'Gratitude',
        duration: '5 min',
        durationMinutes: 5,
        difficulty: 'Beginner',
        description: 'Focus on three positive events or associations from your week. A simple habit to rewire positive emotional default states.',
        benefits: 'Overcomes negativity bias, enhances contentment, and improves general sleep cycles.',
        instructions: [
            'Get a pen and paper, or open our Journal section.',
            'Focus on three distinct occurrences from today that made you feel supported or glad.',
            'Write them down in detail: who was involved, and how it felt.',
            'Spend 1 minute quietly thanking those individuals or contexts in your mind.'
        ],
        icon: <FiHeart className="w-5 h-5" />
    },
    {
        id: 'act-4',
        title: 'Release Tension Stretching',
        category: 'Stretching',
        duration: '8 min',
        durationMinutes: 8,
        difficulty: 'Beginner',
        description: 'Gentle neck, shoulder, and back stretches to release computer fatigue and posture stresses.',
        benefits: 'Decreases muscle aches, releases physical indicators of anxiety, and increases blood circulation.',
        instructions: [
            'Stand up straight and roll your shoulders backwards 10 times.',
            'Gently tilt your head to the right shoulder and hold for 15 seconds. Repeat on the left.',
            'Reach both hands to the sky, interlock your fingers, and stretch upwards.',
            'Slowly bend forward at the hips, letting your arms and head dangle towards the floor.'
        ],
        icon: <FiActivity className="w-5 h-5" />
    },
    {
        id: 'act-5',
        title: 'Ambient Sleep Soundscape',
        category: 'Sleep Relaxation',
        duration: '15 min',
        durationMinutes: 15,
        difficulty: 'Beginner',
        description: 'Relaxing forest rain and ocean surf rhythms combined into a soothing sonic experience to quiet sleep disruptions.',
        benefits: 'Calms hyperactive nervous systems, improves sleep onset speed, and blocks outside room disturbances.',
        instructions: [
            'Lie down in your bed in a dark, quiet room.',
            'Set your screen brightness to lowest or turn it away.',
            'Focus your awareness entirely on the sound of the rain ripples.',
            'Let your breathing match the slow rise and fall of the ocean surf.'
        ],
        icon: <FiMoon className="w-5 h-5" />
    },
    {
        id: 'act-6',
        title: 'Self-Compassion Affirmations',
        category: 'Positive Affirmations',
        duration: '4 min',
        durationMinutes: 4,
        difficulty: 'Beginner',
        description: 'Speak and internalize positive affirmations to rebuild confidence and ease internal criticism.',
        benefits: 'Replaces negative self-talk, builds confidence, and fosters supportive mental habits.',
        instructions: [
            'Stand before a mirror or sit quietly with your eyes closed.',
            'Deeply repeat: "I am doing the best I can with what I have today."',
            'Repeat: "I deserve rest, safety, and understanding from myself."',
            'Repeat: "My mistakes do not define my capacity to grow."',
            'Breathe in the statements and let the tension in your face release.'
        ],
        icon: <FiSun className="w-5 h-5" />
    }
];
