import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiSmile,
    FiUser,
    FiClock,
    FiDroplet,
    FiCheck,
    FiArrowRight,
    FiArrowLeft,
    FiActivity,
    FiAlertTriangle,
    FiHeart,
    FiSliders
} from 'react-icons/fi';
import { PageTransition } from '../components/PageTransition';
import { Button } from '../components/Button';
import { useApp } from '../context/AppContext';

const OCCUPATION_OPTIONS = ['Student', 'Working Professional', 'Self-employed', 'Homemaker', 'Other'];
const EXERCISE_OPTIONS = ['Never', '1–2 Days', '3–4 Days', '5+ Days'];
const FREQUENCY_OPTIONS = ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost Always'];

const COPING_OPTIONS = [
    'Deep Breathing',
    'Meditation',
    'Walking',
    'Exercise',
    'Music',
    'Reading',
    'Journaling',
    'Talking to Friends',
    'Stretching',
    'Other'
];

const GOAL_OPTIONS = [
    'Reduce Stress',
    'Improve Sleep',
    'Increase Focus',
    'Improve Emotional Awareness',
    'Build Healthy Habits',
    'Increase Productivity',
    'Reduce Anxiety',
    'Improve Work-Life Balance',
    'Other'
];

export const OnboardingAssessment = () => {
    const { onboardUser, userProfile } = useApp();
    const navigate = useNavigate();

    // Wizard Step state: 1, 2, 3, 4, 5 (5 is processing)
    const [step, setStep] = useState(1);

    // Form inputs state
    // Step 1: About You
    const [occupation, setOccupation] = useState('');
    const [sleepHours, setSleepHours] = useState(0);
    const [exerciseFrequency, setExerciseFrequency] = useState('');
    const [screenTime, setScreenTime] = useState(0);
    const [waterIntake, setWaterIntake] = useState(0);

    // Step 2: Emotional Well-being
    const [stressedFreq, setStressedFreq] = useState('');
    const [anxiousFreq, setAnxiousFreq] = useState('');
    const [overwhelmedFreq, setOverwhelmedFreq] = useState('');
    const [troubleConcentratingFreq, setTroubleConcentratingFreq] = useState('');

    const [emotionalWellbeing, setEmotionalWellbeing] = useState(0);
    const [motivationLevel, setMotivationLevel] = useState(0);
    const [lifeSatisfaction, setLifeSatisfaction] = useState(0);

    // Step 3: Stress Profile
    const [academicStress, setAcademicStress] = useState(0);
    const [workStress, setWorkStress] = useState(0);
    const [familyStress, setFamilyStress] = useState(0);
    const [relationshipStress, setRelationshipStress] = useState(0);
    const [financialStress, setFinancialStress] = useState(0);
    const [healthStress, setHealthStress] = useState(0);
    const [socialStress, setSocialStress] = useState(0);
    const [uncertaintyStress, setUncertaintyStress] = useState(0);

    // Step 4: Personalization
    const [selectedCoping, setSelectedCoping] = useState([]);
    const [selectedGoals, setSelectedGoals] = useState([]);

    // Step 5: Personalization Loader states
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [currentTipIndex, setCurrentTipIndex] = useState(0);

    const [validationError, setValidationError] = useState('');

    const tips = [
        "Understanding your emotional wellness...",
        "Creating your personalized wellness profile...",
        "Preparing your personalized dashboard...",
        "Personalizing future wellness recommendations...",
        "Welcoming you to MindCompass..."
    ];

    // Trigger loading sequence when we enter step 5
    useEffect(() => {
        if (step !== 5) return;

        let interval = null;
        let progress = 0;

        interval = setInterval(() => {
            progress += 1.5;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);

                // Final submission and redirect
                const submitData = async () => {
                    try {
                        const finalOnboardingData = {
                            name: userProfile?.name || 'Mindful Voyager',
                            occupation,
                            sleepHours,
                            exerciseFrequency,
                            screenTime,
                            waterIntake,
                            emotionalWellbeing: {
                                stressed: stressedFreq,
                                anxious: anxiousFreq,
                                overwhelmed: overwhelmedFreq,
                                trouble_concentrating: troubleConcentratingFreq,
                                overall_score: emotionalWellbeing,
                                motivation_level: motivationLevel,
                                life_satisfaction: lifeSatisfaction
                            },
                            stressContributors: {
                                academic: academicStress,
                                work: workStress,
                                family: familyStress,
                                relationships: relationshipStress,
                                financial: financialStress,
                                health: healthStress,
                                social: socialStress,
                                uncertainty: uncertaintyStress
                            },
                            copingMethods: selectedCoping,
                            goals: selectedGoals
                        };

                        await onboardUser(finalOnboardingData);
                        navigate('/app');
                    } catch (err) {
                        console.error('Onboarding submit failed:', err);
                        alert('Onboarding submission failed. Let\'s try to resubmit.');
                        setStep(4);
                        setLoadingProgress(0);
                    }
                };

                setTimeout(submitData, 800);
            }

            setLoadingProgress(progress);

            // Map progress percentage to current text step
            if (progress < 25) {
                setCurrentTipIndex(0);
            } else if (progress < 50) {
                setCurrentTipIndex(1);
            } else if (progress < 75) {
                setCurrentTipIndex(2);
            } else if (progress < 95) {
                setCurrentTipIndex(3);
            } else {
                setCurrentTipIndex(4);
            }
        }, 40);

        return () => clearInterval(interval);
    }, [step]);


    const handleCopingToggle = (item) => {
        setValidationError('');
        setSelectedCoping(prev =>
            prev.includes(item) ? prev.filter(c => c !== item) : [...prev, item]
        );
    };

    const handleGoalToggle = (item) => {
        setValidationError('');
        setSelectedGoals(prev =>
            prev.includes(item) ? prev.filter(g => g !== item) : [...prev, item]
        );
    };

    const nextStep = () => {
        if (!isStepValid()) {
            if (step === 1) {
                setValidationError('Please select search factors: occupation, exercise frequency, and provide non-zero hours for sleep and screen time.');
            } else if (step === 2) {
                setValidationError('Please provide ratings for all emotional well-being frequencies, and ensure emotional scores are actively set above 0.');
            } else if (step === 4) {
                setValidationError('Please select at least one coping method and one wellness goal.');
            }
            return;
        }
        setValidationError('');
        if (step < 4) {
            setStep(prev => prev + 1);
        } else if (step === 4) {
            setStep(5);
        }
    };

    const prevStep = () => {
        setValidationError('');
        if (step > 1 && step !== 5) {
            setStep(prev => prev - 1);
        }
    };

    // Check if the current step is valid to allow moving forward
    const isStepValid = () => {
        if (step === 1) {
            return occupation !== '' && exerciseFrequency !== '' && sleepHours > 0 && screenTime > 0;
        }
        if (step === 2) {
            return (
                stressedFreq !== '' &&
                anxiousFreq !== '' &&
                overwhelmedFreq !== '' &&
                troubleConcentratingFreq !== '' &&
                emotionalWellbeing > 0 &&
                motivationLevel > 0 &&
                lifeSatisfaction > 0
            );
        }
        if (step === 4) {
            return selectedCoping.length > 0 && selectedGoals.length > 0;
        }
        return true; // Step 3 has defaults (sliders default to 3)
    };

    return (
        <PageTransition>
            <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center p-4 md:p-6 transition-colors duration-300">
                <div className="w-full max-w-2xl bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-[2.5rem] p-6 md:p-10 shadow-sm relative overflow-hidden text-left flex flex-col justify-between min-h-[600px]">

                    {/* Header Steps Bar */}
                    {step < 5 && (
                        <div className="flex flex-col gap-3 mb-8 border-b border-secondary/10 pb-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] tracking-wider uppercase font-bold text-text-dark/50 dark:text-text-light/50">
                                    Step {step} of 4
                                </span>
                                <span className="text-xs font-semibold text-primary dark:text-accent">
                                    {step === 1 && "Baseline Profile"}
                                    {step === 2 && "Emotional Well-being"}
                                    {step === 3 && "Stress Profile"}
                                    {step === 4 && "Personalization"}
                                </span>
                            </div>
                            <div className="w-full bg-secondary/10 dark:bg-secondary/5 h-1.5 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-primary dark:bg-accent rounded-full"
                                    initial={{ width: '25%' }}
                                    animate={{ width: `${step * 25}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {/* Step 1: About You */}
                        {step === 1 && (
                            <motion.div
                                key="step-1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6 flex-grow"
                            >
                                <div>
                                    <h2 className="text-xl md:text-2xl font-bold text-text-dark dark:text-text-light flex items-center gap-2">
                                        <FiUser className="text-secondary" />
                                        Tell us about yourself
                                    </h2>
                                    <p className="text-xs sm:text-sm text-text-dark/65 dark:text-text-light/70 mt-1">
                                        Let's start config with some baseline lifestyle variables.
                                    </p>
                                </div>

                                {/* Occupation Selector */}
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-bold tracking-wider text-text-dark/50 dark:text-text-light/50 block">
                                        Occupation
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {OCCUPATION_OPTIONS.map((opt) => (
                                            <button
                                                key={opt}
                                                type="button"
                                                onClick={() => { setOccupation(opt); setValidationError(''); }}
                                                className={`px-3 py-2.5 rounded-2xl text-xs font-semibold border transition-all cursor-pointer text-center
                                                    ${occupation === opt
                                                        ? 'bg-primary border-primary text-bg-light dark:bg-accent dark:border-accent dark:text-bg-dark font-bold'
                                                        : 'bg-bg-light dark:bg-bg-dark border-secondary/20 dark:border-secondary/10 text-text-dark dark:text-text-light hover:border-secondary/55'
                                                    }
                                                `}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Sleep Hours Slider */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] uppercase font-bold tracking-wider text-text-dark/50 dark:text-text-light/50 flex items-center gap-1.5">
                                            <FiClock className="text-secondary" /> Average Sleep Hours
                                        </label>
                                        <span className="text-xs font-bold text-text-dark dark:text-text-light bg-secondary/10 dark:bg-secondary/5 px-2 py-0.5 rounded-md">
                                            {sleepHours} hrs
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="12"
                                        step="0.5"
                                        value={sleepHours}
                                        onChange={(e) => setSleepHours(Number(e.target.value))}
                                        className="w-full h-1.5 bg-secondary/20 dark:bg-secondary/5 rounded-lg appearance-none cursor-pointer accent-primary dark:accent-accent outline-none"
                                    />
                                    <div className="flex justify-between text-[10px] text-text-dark/40 dark:text-text-light/45 px-1">
                                        <span>0 hrs</span>
                                        <span>6 hrs</span>
                                        <span>12 hrs</span>
                                    </div>
                                </div>

                                {/* Exercise Frequency */}
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-bold tracking-wider text-text-dark/50 dark:text-text-light/50 block">
                                        Exercise Frequency
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {EXERCISE_OPTIONS.map((opt) => (
                                            <button
                                                key={opt}
                                                type="button"
                                                onClick={() => { setExerciseFrequency(opt); setValidationError(''); }}
                                                className={`px-3 py-2.5 rounded-2xl text-xs font-semibold border transition-all cursor-pointer text-center
                                                    ${exerciseFrequency === opt
                                                        ? 'bg-primary border-primary text-bg-light dark:bg-accent dark:border-accent dark:text-bg-dark font-bold'
                                                        : 'bg-bg-light dark:bg-bg-dark border-secondary/20 dark:border-secondary/10 text-text-dark dark:text-text-light hover:border-secondary/55'
                                                    }
                                                `}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Screen Time Slider */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] uppercase font-bold tracking-wider text-text-dark/50 dark:text-text-light/50">
                                            Average Daily Screen Time
                                        </label>
                                        <span className="text-xs font-bold text-text-dark dark:text-text-light bg-secondary/10 dark:bg-secondary/5 px-2 py-0.5 rounded-md">
                                            {screenTime} hrs
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="24"
                                        step="1"
                                        value={screenTime}
                                        onChange={(e) => setScreenTime(Number(e.target.value))}
                                        className="w-full h-1.5 bg-secondary/20 dark:bg-secondary/5 rounded-lg appearance-none cursor-pointer accent-primary dark:accent-accent outline-none"
                                    />
                                    <div className="flex justify-between text-[10px] text-text-dark/40 dark:text-text-light/45 px-1">
                                        <span>0 hrs</span>
                                        <span>12 hrs</span>
                                        <span>24 hrs</span>
                                    </div>
                                </div>

                                {/* Water Intake Slider */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] uppercase font-bold tracking-wider text-text-dark/50 dark:text-text-light/50 flex items-center gap-1.5">
                                            <FiDroplet className="text-secondary" /> Water Intake <span className="text-[9px] lowercase italic font-normal text-text-dark/40 dark:text-text-light/40">(Optional)</span>
                                        </label>
                                        <span className="text-xs font-bold text-text-dark dark:text-text-light bg-secondary/10 dark:bg-secondary/5 px-2 py-0.5 rounded-md">
                                            {waterIntake} L
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="5"
                                        step="0.25"
                                        value={waterIntake}
                                        onChange={(e) => setWaterIntake(Number(e.target.value))}
                                        className="w-full h-1.5 bg-secondary/20 dark:bg-secondary/5 rounded-lg appearance-none cursor-pointer accent-primary dark:accent-accent outline-none"
                                    />
                                    <div className="flex justify-between text-[10px] text-text-dark/40 dark:text-text-light/45 px-1">
                                        <span>0 L</span>
                                        <span>2.5 L</span>
                                        <span>5 L</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Emotional Well-being */}
                        {step === 2 && (
                            <motion.div
                                key="step-2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6 flex-grow"
                            >
                                <div>
                                    <h2 className="text-xl md:text-2xl font-bold text-text-dark dark:text-text-light flex items-center gap-2">
                                        <FiHeart className="text-secondary" />
                                        Emotional Well-being
                                    </h2>
                                    <p className="text-xs sm:text-sm text-text-dark/65 dark:text-text-light/70 mt-1">
                                        Over the past two weeks, how often have you experienced the following?
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        { label: "Stressed", q: "How often have you felt stressed?", value: stressedFreq, setter: setStressedFreq },
                                        { label: "Anxious", q: "How often have you felt anxious?", value: anxiousFreq, setter: setAnxiousFreq },
                                        { label: "Overwhelmed", q: "How often have you felt overwhelmed?", value: overwhelmedFreq, setter: setOverwhelmedFreq },
                                        { label: "Trouble Concentrating", q: "How often have you had trouble concentrating?", value: troubleConcentratingFreq, setter: setTroubleConcentratingFreq }
                                    ].map((field) => (
                                        <div key={field.label} className="space-y-2 border-b border-secondary/5 pb-3">
                                            <span className="text-xs font-semibold text-text-dark/75 dark:text-text-light/75 block">
                                                {field.q}
                                            </span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {FREQUENCY_OPTIONS.map((freq) => (
                                                    <button
                                                        key={freq}
                                                        type="button"
                                                        onClick={() => { field.setter(freq); setValidationError(''); }}
                                                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer
                                                            ${field.value === freq
                                                                ? 'bg-secondary/15 border-secondary text-text-dark dark:text-text-light font-black shadow-xs'
                                                                : 'bg-bg-light dark:bg-bg-dark border-secondary/15 dark:border-secondary/5 text-text-dark/60 dark:text-text-light/60 hover:border-secondary/40'
                                                            }
                                                        `}
                                                    >
                                                        {freq}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Baseline Sliders */}
                                <div className="space-y-4 pt-2">
                                    {[
                                        { label: "Overall Emotional Well-being", val: emotionalWellbeing, setter: setEmotionalWellbeing },
                                        { label: "Motivation Level", val: motivationLevel, setter: setMotivationLevel },
                                        { label: "Life Satisfaction", val: lifeSatisfaction, setter: setLifeSatisfaction }
                                    ].map((slider) => (
                                        <div key={slider.label} className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <label className="font-semibold text-text-dark/70 dark:text-text-light/75">{slider.label}</label>
                                                <span className="font-bold text-primary dark:text-accent">{slider.val} / 10</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="10"
                                                step="1"
                                                value={slider.val}
                                                onChange={(e) => slider.setter(Number(e.target.value))}
                                                className="w-full h-1 bg-secondary/20 dark:bg-secondary/5 rounded-lg appearance-none cursor-pointer accent-primary dark:accent-accent outline-none"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Stress Profile */}
                        {step === 3 && (
                            <motion.div
                                key="step-3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6 flex-grow"
                            >
                                <div>
                                    <h2 className="text-xl md:text-2xl font-bold text-text-dark dark:text-text-light flex items-center gap-2">
                                        <FiAlertTriangle className="text-secondary" />
                                        Stress Profile
                                    </h2>
                                    <p className="text-xs sm:text-sm text-text-dark/65 dark:text-text-light/70 mt-1">
                                        Please rate how much each area currently contributes to your stress. (1 = None, 5 = High)
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                                    {[
                                        { label: "Academic / Studies", val: academicStress, setter: setAcademicStress },
                                        { label: "Work / Career", val: workStress, setter: setWorkStress },
                                        { label: "Family", val: familyStress, setter: setFamilyStress },
                                        { label: "Relationships", val: relationshipStress, setter: setRelationshipStress },
                                        { label: "Financial Situation", val: financialStress, setter: setFinancialStress },
                                        { label: "Health", val: healthStress, setter: setHealthStress },
                                        { label: "Social Life", val: socialStress, setter: setSocialStress },
                                        { label: "Future / Career Uncertainty", val: uncertaintyStress, setter: setUncertaintyStress }
                                    ].map((item) => (
                                        <div key={item.label} className="bg-bg-light dark:bg-bg-dark border border-secondary/15 dark:border-secondary/5 rounded-2xl p-3.5 space-y-1.5 flex flex-col justify-between">
                                            <div className="flex justify-between text-xs font-semibold items-center">
                                                <span className="text-text-dark dark:text-text-light leading-none">{item.label}</span>
                                                <span className="text-primary dark:text-accent font-bold leading-none bg-primary/10 dark:bg-accent/15 px-2 py-0.5 rounded text-[10px]">
                                                    Rating: {item.val}
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="5"
                                                step="1"
                                                value={item.val}
                                                onChange={(e) => item.setter(Number(e.target.value))}
                                                className="w-full h-1 bg-secondary/20 dark:bg-secondary/10 rounded-lg appearance-none cursor-pointer accent-primary dark:accent-accent outline-none"
                                            />
                                            <div className="flex justify-between text-[8px] text-text-dark/45 dark:text-text-light/45 px-0.5">
                                                <span>None</span>
                                                <span>Moderate</span>
                                                <span>Severe</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Step 4: Personalization */}
                        {step === 4 && (
                            <motion.div
                                key="step-4"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6 flex-grow"
                            >
                                <div>
                                    <h2 className="text-xl md:text-2xl font-bold text-text-dark dark:text-text-light flex items-center gap-2">
                                        <FiSliders className="text-secondary" />
                                        Personalize Recommendations
                                    </h2>
                                    <p className="text-xs sm:text-sm text-text-dark/65 dark:text-text-light/70 mt-1">
                                        Tailor your coping tools, goal paths, and emotional twin layout settings.
                                    </p>
                                </div>

                                {/* Preferred Coping Methods */}
                                <div className="space-y-3">
                                    <label className="text-[10px] uppercase font-bold tracking-wider text-text-dark/50 dark:text-text-light/50 block">
                                        Preferred Coping Methods (Select at least one)
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {COPING_OPTIONS.map((method) => {
                                            const isSelected = selectedCoping.includes(method);
                                            return (
                                                <button
                                                    key={method}
                                                    type="button"
                                                    onClick={() => handleCopingToggle(method)}
                                                    className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer select-none
                                                        ${isSelected
                                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold'
                                                            : 'bg-bg-light dark:bg-bg-dark border-secondary/20 dark:border-secondary/15 text-text-dark dark:text-text-light hover:border-secondary/55'
                                                        }
                                                    `}
                                                >
                                                    {method}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Wellness Goals */}
                                <div className="space-y-3">
                                    <label className="text-[10px] uppercase font-bold tracking-wider text-text-dark/50 dark:text-text-light/50 block">
                                        Wellness Goals (Select at least one)
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {GOAL_OPTIONS.map((goal) => {
                                            const isSelected = selectedGoals.includes(goal);
                                            return (
                                                <button
                                                    key={goal}
                                                    type="button"
                                                    onClick={() => handleGoalToggle(goal)}
                                                    className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer select-none
                                                        ${isSelected
                                                            ? 'bg-primary border-primary text-bg-light dark:bg-accent dark:border-accent dark:text-bg-dark font-bold shadow-xs'
                                                            : 'bg-bg-light dark:bg-bg-dark border-secondary/20 dark:border-secondary/15 text-text-dark dark:text-text-light hover:border-secondary/55'
                                                        }
                                                    `}
                                                >
                                                    {goal}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 5: Ticking loader simulation */}
                        {step === 5 && (
                            <motion.div
                                key="step-5"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-8 py-8 flex flex-col items-center justify-center flex-grow text-center"
                            >
                                <div className="relative w-24 h-24 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                        {/* Outer circle track */}
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            className="stroke-secondary/10 dark:stroke-secondary/5 fill-transparent"
                                            strokeWidth="6"
                                        />
                                        {/* Colored circle path */}
                                        <motion.circle
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            className="stroke-primary dark:stroke-accent fill-transparent"
                                            strokeWidth="6"
                                            strokeDasharray="251.2"
                                            strokeDashoffset={251.2 - (251.2 * loadingProgress) / 100}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute text-sm font-bold text-text-dark dark:text-text-light">
                                        {Math.round(loadingProgress)}%
                                    </div>
                                </div>

                                <div className="space-y-4 max-w-md">
                                    <h3 className="text-xl font-bold text-text-dark dark:text-text-light tracking-tight">
                                        Personalizing Your Experience
                                    </h3>

                                    {/* Action checklists dynamic status */}
                                    <div className="space-y-2.5 text-left border border-secondary/10 dark:border-secondary/5 bg-secondary/5 dark:bg-card-dark p-6 rounded-[2rem] shadow-xs">
                                        {[
                                            { text: "Understanding your emotional wellness...", threshold: 10 },
                                            { text: "Creating your personalized wellness profile...", threshold: 35 },
                                            { text: "Preparing your personalized dashboard...", threshold: 60 },
                                            { text: "Personalizing future wellness recommendations...", threshold: 85 }
                                        ].map((item, idx) => {
                                            const isDone = loadingProgress >= item.threshold;
                                            const isActive = !isDone && (idx === 0 || loadingProgress >= (idx > 0 ? [10, 35, 60, 85][idx - 1] : 0));
                                            return (
                                                <div
                                                    key={idx}
                                                    className={`flex items-center gap-3 transition-all duration-300
                                                        ${isDone ? 'opacity-100 font-medium' : isActive ? 'opacity-90 font-bold' : 'opacity-35'}
                                                    `}
                                                >
                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors
                                                        ${isDone
                                                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500'
                                                            : isActive
                                                                ? 'bg-primary/10 border-primary text-primary dark:bg-accent/15 dark:border-accent dark:text-accent animate-pulse'
                                                                : 'bg-transparent border-secondary/20'
                                                        }
                                                    `}>
                                                        {isDone ? <FiCheck className="w-3 h-3" /> : (idx + 1)}
                                                    </div>
                                                    <span className={`text-xs text-text-dark dark:text-text-light transition-all`}>
                                                        {item.text}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <AnimatePresence mode="wait">
                                        {loadingProgress >= 93 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="text-emerald-500 font-bold text-sm tracking-wide mt-2"
                                            >
                                                🎉 Welcome to MindCompass! Redirecting...
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Footer Nav Action buttons */}
                    {step < 5 && (
                        <div className="flex flex-col gap-4 mt-8 pt-4 border-t border-secondary/10">
                            {validationError && (
                                <div className="p-4 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl text-xs sm:text-sm border border-amber-500/15 flex items-center gap-2">
                                    <FiAlertTriangle className="w-5 h-5 flex-shrink-0" />
                                    <span>{validationError}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center w-full">
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    disabled={step === 1}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-text-dark/65 dark:text-text-light/70 disabled:opacity-30 cursor-pointer outline-none font-bold"
                                >
                                    <FiArrowLeft /> Back
                                </button>
                                <Button
                                    onClick={nextStep}
                                    variant="primary"
                                    size="md"
                                    className="flex items-center gap-1.5 font-bold outline-none"
                                >
                                    {step === 4 ? "Complete Setup" : "Next"} <FiArrowRight />
                                </Button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </PageTransition>
    );
};

