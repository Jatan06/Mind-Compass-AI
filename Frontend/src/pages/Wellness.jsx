import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiCompass,
    FiHeart,
    FiClock,
    FiAward,
    FiPlay,
    FiPause,
    FiRotateCcw,
    FiSquare,
    FiStar,
    FiCheckSquare,
    FiArrowLeft,
    FiX,
    FiWind,
    FiMoon,
    FiSun,
    FiActivity,
    FiSmile,
    FiBookOpen,
    FiUsers,
    FiMapPin,
    FiMusic
} from 'react-icons/fi';
import { PageTransition } from '../components/PageTransition';
import { Button } from '../components/Button';
import { useApp } from '../context/AppContext';
import { activitiesAPI } from '../services/api';
import { AmbientMusicPlayer } from '../components/AmbientMusicPlayer';
import { audioEngine, getSoundscapeForCategory } from '../utils/soundscapes';
import {
    BreathingCircleWidget,
    TextInputWidget,
    ChecklistWidget,
    SliderWidget,
    ProgressTapWidget,
    HoldReleaseWidget
} from '../components/InteractiveWidgets';

import { BreathingPacer } from '../components/wellness/BreathingPacer';
import { BubblePopDeStresser } from '../components/wellness/BubblePopDeStresser';
import { WorryShredder } from '../components/wellness/WorryShredder';
import { GroundingWizard } from '../components/wellness/GroundingWizard';
import { BodyStretchGuide } from '../components/wellness/BodyStretchGuide';
import { CognitiveShuffle } from '../components/wellness/CognitiveShuffle';
import { GratitudeConstellation } from '../components/wellness/GratitudeConstellation';
import { ThoughtCourtScale } from '../components/wellness/ThoughtCourtScale';
import { ZenRiverThoughts } from '../components/wellness/ZenRiverThoughts';
import { STOPBrakePedal } from '../components/wellness/STOPBrakePedal';
import { FarFocusTargetChaser } from '../components/wellness/FarFocusTargetChaser';
import { ZenCountingStreak } from '../components/wellness/ZenCountingStreak';

const categoryIcons = {
    'Breathing': <FiWind className="w-5 h-5" />,
    'Meditation': <FiCompass className="w-5 h-5" />,
    'Mindfulness': <FiActivity className="w-5 h-5" />,
    'Sleep Hygiene': <FiMoon className="w-5 h-5" />,
    'Gratitude': <FiHeart className="w-5 h-5" />,
    'Journaling': <FiBookOpen className="w-5 h-5" />,
    'Physical Activity': <FiActivity className="w-5 h-5" />,
    'Relaxation': <FiSmile className="w-5 h-5" />,
    'Grounding': <FiMapPin className="w-5 h-5" />,
    'Stress Management': <FiWind className="w-5 h-5" />,
    'Anxiety Relief': <FiActivity className="w-5 h-5" />,
    'Emotional Regulation': <FiHeart className="w-5 h-5" />,
    'Digital Wellbeing': <FiSun className="w-5 h-5" />,
    'Social Wellness': <FiUsers className="w-5 h-5" />,
    'Cognitive Exercises': <FiAward className="w-5 h-5" />
};

const getCategoryIcon = (category) => {
    return categoryIcons[category] || <FiActivity className="w-5 h-5" />;
};

export const Wellness = () => {
    const { favorites, toggleFavorite, completeActivity, todayRecommendation, recLoading } = useApp();

    const [activeView, setActiveView] = useState('mission'); // 'mission' | 'session' | 'feedback'
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [canProceed, setCanProceed] = useState(false);
    const [sessionViewMode, setSessionViewMode] = useState('interactive'); // 'interactive' | 'timer'
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [difficultyFilter, setDifficultyFilter] = useState('All');
    const [durationFilter, setDurationFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const todaysRecommendation = todayRecommendation?.activity || null;
    // reason is an array of strings from the API — join the first two bullets for display
    const recReasonArray = Array.isArray(todayRecommendation?.reason) ? todayRecommendation.reason : [];
    const recReasonSection1 = recReasonArray.length > 0 ? recReasonArray[0] : "";
    const recReasonSection2 = recReasonArray.length > 1 ? recReasonArray.slice(1).join(" ") : "";

    // Timer States
    const [timeLeft, setTimeLeft] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [resetKey, setResetKey] = useState(0);


    // Feedback States
    const [satisfaction, setSatisfaction] = useState(5);
    const [moodImproved, setMoodImproved] = useState('Yes');
    const [feedbackComment, setFeedbackComment] = useState('');
    const [submittingFeedback, setSubmittingFeedback] = useState(false);
    const [moodAfter, setMoodAfter] = useState(7);
    const [stressAfter, setStressAfter] = useState(5);

    useEffect(() => {
        if (!selectedActivity || !selectedActivity.instructions) return;
        const inst = selectedActivity.instructions[currentStep];
        if (typeof inst === 'string' || inst?.type === 'static_text') {
            setCanProceed(true);
        } else {
            setCanProceed(false);
        }
    }, [currentStep, selectedActivity]);

    useEffect(() => {
        let isMounted = true;
        const fetchActivities = async () => {
            try {
                setLoading(true);
                const res = await activitiesAPI.getAll();
                if (isMounted) {
                    if (res.status === 200 && Array.isArray(res.data)) {
                        setActivities(res.data);
                    }
                    setLoading(false);
                }
            } catch (err) {
                if (isMounted) {
                    setError('Failed to load wellness library.');
                    setLoading(false);
                }
                console.error(err);
            }
        };

        fetchActivities();
        return () => { isMounted = false; };
    }, []);

    // Get categories dynamically
    const categories = ['All', ...new Set(activities.map(a => a.category))];

    const getDurationNum = (durStr) => {
        const val = parseInt(durStr);
        return isNaN(val) ? 0 : val;
    };

    // ── Fullscreen & Wake Lock ──────────────────────────────────────────────
    const wakeLockRef = React.useRef(null);

    const enterFullscreen = async () => {
        try {
            const el = document.documentElement;
            if (el.requestFullscreen) await el.requestFullscreen();
            else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        } catch (_) { /* user may deny — gracefully ignore */ }
        // Keep screen awake during session
        try {
            if ('wakeLock' in navigator) {
                wakeLockRef.current = await navigator.wakeLock.request('screen');
            }
        } catch (_) { }
    };

    const exitFullscreen = async () => {
        try {
            if (document.fullscreenElement || document.webkitFullscreenElement) {
                if (document.exitFullscreen) await document.exitFullscreen();
                else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            }
        } catch (_) { }
        try {
            if (wakeLockRef.current) {
                await wakeLockRef.current.release();
                wakeLockRef.current = null;
            }
        } catch (_) { }
    };

    // Exit fullscreen if user presses Escape (browser does it automatically,
    // but we still need to release the wake lock)
    useEffect(() => {
        const onFsChange = () => {
            if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                if (wakeLockRef.current) {
                    wakeLockRef.current.release().catch(() => { });
                    wakeLockRef.current = null;
                }
            }
        };
        document.addEventListener('fullscreenchange', onFsChange);
        document.addEventListener('webkitfullscreenchange', onFsChange);
        return () => {
            document.removeEventListener('fullscreenchange', onFsChange);
            document.removeEventListener('webkitfullscreenchange', onFsChange);
        };
    }, []);

    // We no longer display the list or filters, keeping just fetching logically for fallback.
    const hasActivities = activities.length > 0;

    // Session Logic
    const startTimer = (activity) => {
        setSelectedActivity(activity);
        setCurrentStep(0);
        setIsTimerRunning(true);
        setActiveView('session');
        setResetKey(prev => prev + 1);
        enterFullscreen();

        const soundscape = getSoundscapeForCategory(activity.category);
        const mins = getDurationNum(activity.duration) || 5;
        audioEngine.restart(soundscape, mins * 60);
    };

    const handleNextStep = () => {
        if (!selectedActivity || !selectedActivity.instructions) return;
        if (currentStep < selectedActivity.instructions.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleCompleteSession();
        }
    };

    const handlePrevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleCompleteSession = () => {
        setIsTimerRunning(false);
        audioEngine.stop();
        exitFullscreen();
        setActiveView('feedback');
    };

    const handleTimerPause = () => {
        setIsTimerRunning(prev => !prev);
    };

    const handleTimerReset = () => {
        const mins = getDurationNum(selectedActivity?.duration) || 5;
        setTimeLeft(mins * 60);
        setIsTimerRunning(true);
        setResetKey(prev => prev + 1);
        if (selectedActivity) {
            const soundscape = getSoundscapeForCategory(selectedActivity.category);
            audioEngine.restart(soundscape, mins * 60);
        }
    };

    const handleSkipTimer = () => {
        setIsTimerRunning(false);
        audioEngine.stop();
        exitFullscreen();
        setTimeLeft(0);
        setActiveView('feedback');
    };

    // Feedback Submit
    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        setSubmittingFeedback(true);
        try {
            const mins = getDurationNum(selectedActivity.duration) || 5;
            await completeActivity(selectedActivity.id, mins, {
                mood_after: moodAfter,
                stress_after: stressAfter,
                comment: feedbackComment,
                // Legacy fields preserved just in case
                satisfaction: moodAfter >= 5 ? 5 : 3,
                moodImproved: moodAfter >= 7 ? 'Yes' : 'No Change'
            });
            // Reset feedback form states
            setMoodAfter(7);
            setStressAfter(5);
            setFeedbackComment('');
            setActiveView('mission');
            setSelectedActivity(null);
            alert('Thank you for your feedback! Your activity history is updated.');
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.error || err.message || "An error occurred.";
            alert(`Could not complete activity: ${errMsg}`);
        } finally {
            setSubmittingFeedback(false);
        }
    };

    const formatTimer = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <PageTransition>
            <div className="flex-grow flex flex-col gap-6 text-left max-w-5xl mx-auto w-full">

                <AnimatePresence mode="wait">
                    {/* View 1: Mission Intro */}
                    {activeView === 'mission' && (
                        <motion.div
                            key="mission-view"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 max-w-4xl mx-auto"
                        >
                            {!recLoading && todaysRecommendation ? (
                                <div className="space-y-12 w-full text-center">
                                    <div className="space-y-4">
                                        <div className="inline-flex items-center justify-center p-4 bg-primary/10 dark:bg-accent/15 rounded-full text-primary dark:text-accent mb-2">
                                            {getCategoryIcon(todaysRecommendation.category)}
                                        </div>
                                        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-text-dark dark:text-text-light">
                                            Today's Wellness Mission
                                        </h1>
                                        <p className="text-base md:text-lg text-text-dark/70 dark:text-text-light/70 max-w-2xl mx-auto">
                                            Your AI Coach has organized a personalized interactive session tailored to your current reflections and nervous system state.
                                        </p>
                                    </div>

                                    <div className="bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-[2.5rem] p-8 md:p-12 shadow-md relative overflow-hidden flex flex-col gap-8 text-left max-w-3xl mx-auto">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 dark:bg-accent/5 rounded-full filter blur-3xl pointer-events-none" />

                                        <div>
                                            <span className="text-[11px] uppercase font-bold tracking-widest text-secondary block mb-1">
                                                Mission Title
                                            </span>
                                            <h3 className="text-2xl md:text-3xl font-bold text-text-dark dark:text-text-light">
                                                {todaysRecommendation.title}
                                            </h3>
                                        </div>

                                        <div className="bg-secondary/5 dark:bg-secondary/10 p-5 rounded-2xl border border-secondary/10">
                                            <span className="text-[11px] uppercase font-bold tracking-widest text-secondary block mb-2">
                                                Why This Mission?
                                            </span>
                                            <p className="text-sm md:text-base text-text-dark/80 dark:text-text-light/85 leading-relaxed">
                                                {recReasonSection1 || "Suggested to help you center and relax today."}
                                            </p>
                                        </div>
                                        <div className="bg-secondary/5 dark:bg-secondary/10 p-5 rounded-2xl border border-secondary/10 mt-4">
                                            <span className="text-[11px] uppercase font-bold tracking-widest text-secondary block mb-2">
                                                Alternative Considerations & Confidence
                                            </span>
                                            <p className="text-sm md:text-base text-text-dark/80 dark:text-text-light/85 leading-relaxed">
                                                {recReasonSection2 || "No alternatives were evaluated."}
                                            </p>
                                            <div className="mt-4 pt-3 border-t border-secondary/10 flex items-center justify-between text-xs font-semibold text-text-dark/60 dark:text-text-light/60">
                                                <span>Suitability Score Match </span>
                                                <span className="text-primary font-bold">{todayRecommendation.confidence}%</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-6 py-2 border-y border-secondary/10">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase font-bold tracking-widest text-text-dark/45 dark:text-text-light/50">Estimated Duration</span>
                                                <span className="text-sm font-semibold flex items-center gap-1.5 mt-1"><FiClock className="w-4 h-4 text-primary" /> {todaysRecommendation.duration}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase font-bold tracking-widest text-text-dark/45 dark:text-text-light/50">Intensity</span>
                                                <span className="text-sm font-semibold flex items-center gap-1.5 mt-1"><FiAward className="w-4 h-4 text-primary" /> {todaysRecommendation.difficulty}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase font-bold tracking-widest text-text-dark/45 dark:text-text-light/50">Format</span>
                                                <span className="text-sm font-semibold flex items-center gap-1.5 mt-1"><FiCompass className="w-4 h-4 text-primary" /> Interactive Session</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => startTimer(todaysRecommendation)}
                                            className="w-full inline-flex items-center justify-center gap-2 text-lg font-bold bg-primary hover:bg-primary-hover dark:bg-accent dark:hover:bg-accent-hover text-bg-light dark:text-bg-dark px-8 py-4 rounded-full transition-all cursor-pointer shadow-md mt-2 group animate-pulse hover:animate-none"
                                        >
                                            Begin Your Mission
                                            <FiPlay className="w-5 h-5 fill-current group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            ) : recLoading ? (
                                <div className="py-20 text-center animate-pulse">Consulting AI Coach...</div>
                            ) : (
                                <div className="py-20 text-center text-text-dark/60">No missions scheduled for you at this time. Please log a daily check-in.</div>
                            )}

                            {/* Library Entry Point */}
                            <div className="mt-12 text-center border-t border-secondary/10 pt-10 w-full max-w-4xl mx-auto">
                                <h4 className="text-lg md:text-xl font-bold tracking-tight mb-4 text-text-dark dark:text-text-light">Need a different approach?</h4>
                                <button
                                    onClick={() => setActiveView('library')}
                                    className="px-8 py-3 border border-secondary/30 rounded-full font-bold uppercase tracking-wider text-xs hover:bg-secondary/5 transition-colors cursor-pointer"
                                >
                                    Explore More Activities
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* View: Library (Manual Browsing) */}
                    {activeView === 'library' && (
                        <motion.div
                            key="library-view"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-8"
                        >
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                                <div>
                                    <h1 className="text-3xl font-bold tracking-tight text-text-dark dark:text-text-light">Wellness Library</h1>
                                    <p className="text-text-dark/60 dark:text-text-light/60 mt-1">Explore and manually select an activity.</p>
                                </div>
                                <button
                                    onClick={() => setActiveView('mission')}
                                    className="px-5 py-2.5 bg-card-light dark:bg-card-dark border border-secondary/20 rounded-xl hover:bg-secondary/5 flex items-center gap-2 text-sm font-bold shadow-sm transition-colors"
                                >
                                    <FiArrowLeft className="w-4 h-4" /> Back to Mission
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {activities.map(act => (
                                    <div key={act.id} className="bg-card-light dark:bg-card-dark p-6 rounded-3xl border border-secondary/15 flex flex-col justify-between hover:shadow-lg transition-transform hover:-translate-y-1 group relative overflow-hidden">
                                        <div className="relative z-10">
                                            <div className="w-12 h-12 bg-primary/10 dark:bg-accent/15 rounded-full flex items-center justify-center text-primary dark:text-accent mb-5">
                                                {getCategoryIcon(act.category)}
                                            </div>
                                            <h3 className="font-bold text-xl mb-1 text-text-dark dark:text-text-light group-hover:text-primary dark:group-hover:text-accent transition-colors">{act.title}</h3>
                                            <span className="text-[10px] uppercase font-bold tracking-widest text-secondary mb-4 block">{act.category}</span>
                                            <p className="text-sm text-text-dark/70 dark:text-text-light/75 mb-6 line-clamp-3 leading-relaxed">{act.description}</p>
                                        </div>
                                        <div className="relative z-10 flex items-center justify-between">
                                            <div className="flex items-center gap-3 text-xs font-semibold text-text-dark/50 dark:text-text-light/50">
                                                <span className="flex items-center gap-1"><FiClock className="w-3.5 h-3.5 text-primary" /> {act.duration}</span>
                                            </div>
                                            <button
                                                onClick={() => startTimer(act)}
                                                className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center text-primary dark:text-accent font-semibold hover:bg-primary hover:text-white transition-all cursor-pointer shadow-sm"
                                                title="Start Session"
                                            >
                                                <FiPlay className="w-4 h-4 fill-current ml-0.5" />
                                            </button>
                                        </div>
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 dark:bg-accent/5 rounded-bl-full pointer-events-none group-hover:bg-primary/10 transition-colors" />
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* View 2: Interactive Session Sequence */}
                    {activeView === 'session' && selectedActivity && (
                        <motion.div
                            key="session-view"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-6 md:p-10 shadow-sm max-w-4xl mx-auto w-full min-h-[70vh] flex flex-col justify-between"
                        >
                            {/* Clean Top Navigation Bar */}
                            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4 border-b border-secondary/10 dark:border-secondary/5 pb-4">
                                <button
                                    onClick={handleSkipTimer}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-dark/60 dark:text-text-light/60 hover:text-red-500 transition-colors cursor-pointer"
                                >
                                    <FiX className="w-4 h-4" /> End Session
                                </button>
                                
                                <div className="text-center flex flex-col items-center min-w-0">
                                    <span className="bg-secondary/15 dark:bg-secondary/10 text-primary dark:text-accent text-[10px] sm:text-[11px] font-bold px-3 py-1 rounded-full inline-flex items-center gap-1.5 truncate">
                                        {selectedActivity.category} • {selectedActivity.difficulty}
                                    </span>
                                    <h3 className="text-sm sm:text-lg font-bold tracking-tight text-text-dark dark:text-text-light mt-1 truncate max-w-[200px] sm:max-w-none">
                                        {selectedActivity.title}
                                    </h3>
                                </div>

                                <div className="flex items-center gap-2 sm:gap-3">
                                    {/* Live Header Countdown Timer */}
                                    <div className="bg-primary/10 dark:bg-accent/15 border border-primary/20 dark:border-accent/20 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full flex items-center gap-2">
                                        <button
                                            onClick={handleTimerPause}
                                            className="text-primary dark:text-accent hover:scale-110 transition-transform cursor-pointer"
                                            title={isTimerRunning ? 'Pause Timer' : 'Resume Timer'}
                                        >
                                            {isTimerRunning ? <FiPause className="w-3.5 h-3.5 fill-current" /> : <FiPlay className="w-3.5 h-3.5 fill-current translate-x-0.5" />}
                                        </button>
                                        <span className="font-mono text-xs sm:text-sm font-bold text-primary dark:text-accent tracking-wide">
                                            {formatTimer(timeLeft)}
                                        </span>
                                    </div>

                                    {/* Step count badge (if in Step mode) */}
                                    {sessionViewMode === 'steps' && (
                                        <div className="text-xs font-bold uppercase tracking-wider text-text-dark/50 hidden sm:block">
                                            Step {currentStep + 1} / {selectedActivity.instructions?.length || 1}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Activity Short Description */}
                            <p className="text-xs sm:text-sm text-text-dark/65 dark:text-text-light/75 max-w-xl mx-auto text-center leading-relaxed py-2">
                                {selectedActivity.short_description || selectedActivity.description}
                            </p>

                            {/* Mode Switcher Pill (2 Clean Modes: Interactive & Step-by-Step) */}
                            <div className="flex flex-wrap justify-center items-center gap-2 border-b border-secondary/10 dark:border-secondary/5 pb-4">
                                <button
                                    onClick={() => setSessionViewMode('interactive')}
                                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${sessionViewMode === 'interactive'
                                            ? 'bg-primary dark:bg-accent text-white dark:text-bg-dark shadow-sm'
                                            : 'bg-secondary/10 text-text-dark/70 dark:text-text-light/70 hover:bg-secondary/20'
                                        }`}
                                >
                                    🎮 Interactive Experience
                                </button>
                                <button
                                    onClick={() => setSessionViewMode('steps')}
                                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${sessionViewMode === 'steps'
                                            ? 'bg-primary dark:bg-accent text-white dark:text-bg-dark shadow-sm'
                                            : 'bg-secondary/10 text-text-dark/70 dark:text-text-light/70 hover:bg-secondary/20'
                                        }`}
                                >
                                    📋 Step-by-Step Guide
                                </button>
                            </div>
                            {/* Background Ambient Music */}
                            <AmbientMusicPlayer
                                key={resetKey}
                                category={selectedActivity.category}
                                isTimerRunning={isTimerRunning}
                                durationSeconds={(getDurationNum(selectedActivity.duration) || 5) * 60}
                            />

                            {/* Interactive Widget View vs Guided HUD Timer View */}
                            {sessionViewMode === 'interactive' ? (
                                <div className="py-2">
                                    {selectedActivity.category === 'Breathing' && (
                                        <BreathingPacer activity={selectedActivity} onComplete={handleSkipTimer} />
                                    )}
                                    {selectedActivity.category === 'Grounding' && (
                                        <GroundingWizard activity={selectedActivity} onComplete={handleSkipTimer} />
                                    )}
                                    {selectedActivity.category === 'Physical Activity' && (
                                        <BodyStretchGuide activity={selectedActivity} onComplete={handleSkipTimer} />
                                    )}
                                    {selectedActivity.category === 'Sleep Hygiene' && (
                                        <CognitiveShuffle activity={selectedActivity} onComplete={handleSkipTimer} />
                                    )}
                                    {(selectedActivity.category === 'Journaling' || selectedActivity.title.toLowerCase().includes('shred')) && (
                                        <WorryShredder activity={selectedActivity} onComplete={handleSkipTimer} />
                                    )}
                                    {selectedActivity.category === 'Gratitude' && (
                                        <GratitudeConstellation activity={selectedActivity} onComplete={handleSkipTimer} />
                                    )}
                                    {selectedActivity.category === 'Anxiety Relief' && (
                                        <ThoughtCourtScale activity={selectedActivity} onComplete={handleSkipTimer} />
                                    )}
                                    {selectedActivity.category === 'Mindfulness' && (
                                        <ZenRiverThoughts activity={selectedActivity} onComplete={handleSkipTimer} />
                                    )}
                                    {selectedActivity.category === 'Emotional Regulation' && (
                                        <STOPBrakePedal activity={selectedActivity} onComplete={handleSkipTimer} />
                                    )}
                                    {selectedActivity.category === 'Digital Wellbeing' && (
                                        <FarFocusTargetChaser activity={selectedActivity} onComplete={handleSkipTimer} />
                                    )}
                                    {selectedActivity.category === 'Cognitive Exercises' && (
                                        <ZenCountingStreak activity={selectedActivity} onComplete={handleSkipTimer} />
                                    )}
                                    {selectedActivity.category !== 'Breathing' &&
                                        selectedActivity.category !== 'Grounding' &&
                                        selectedActivity.category !== 'Physical Activity' &&
                                        selectedActivity.category !== 'Sleep Hygiene' &&
                                        selectedActivity.category !== 'Journaling' &&
                                        selectedActivity.category !== 'Gratitude' &&
                                        selectedActivity.category !== 'Anxiety Relief' &&
                                        selectedActivity.category !== 'Mindfulness' &&
                                        selectedActivity.category !== 'Emotional Regulation' &&
                                        selectedActivity.category !== 'Digital Wellbeing' &&
                                        selectedActivity.category !== 'Cognitive Exercises' &&
                                        !selectedActivity.title.toLowerCase().includes('shred') && (
                                            <BubblePopDeStresser activity={selectedActivity} onComplete={handleSkipTimer} />
                                        )}
                                </div>
                            ) : (
                                /* Guided HUD Circle Timer */
                                <div className="py-6 flex flex-col items-center justify-center">
                                    <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full border-4 border-secondary/10 dark:border-secondary/5 flex flex-col items-center justify-center relative bg-secondary/5 dark:bg-secondary/5 shadow-inner">
                                        {isTimerRunning && (
                                            <motion.div
                                                animate={{ scale: [1, 1.08, 1] }}
                                                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                                                className="absolute inset-0 bg-primary/5 dark:bg-accent/5 rounded-full pointer-events-none"
                                            />
                                        )}

                                        <div className="text-4xl sm:text-5xl font-mono font-bold tracking-tight text-text-dark dark:text-text-light select-none">
                                            {formatTimer(timeLeft)}
                                        </div>
                                        <span className="text-[10px] tracking-widest uppercase text-text-dark/45 dark:text-text-light/50 font-bold mt-2">
                                            {isTimerRunning ? 'IN PROGRESS' : 'PAUSED'}
                                        </span>
                                    </div>

                                    {/* Controls */}
                                    <div className="flex items-center gap-4 mt-8">
                                        <button
                                            onClick={handleTimerReset}
                                            className="p-3 bg-secondary/15 dark:bg-secondary/10 rounded-full hover:bg-secondary/25 transition-colors cursor-pointer text-text-dark dark:text-text-light"
                                            title="Reset"
                                        >
                                            <FiRotateCcw className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={handleTimerPause}
                                            className="p-4 bg-primary dark:bg-accent text-bg-light dark:text-bg-dark rounded-full hover:scale-105 shadow transition-all cursor-pointer"
                                            title={isTimerRunning ? 'Pause' : 'Resume'}
                                        >
                                            {isTimerRunning ? <FiPause className="w-6 h-6 fill-current" /> : <FiPlay className="w-6 h-6 fill-current translate-x-0.5" />}
                                        </button>
                                        <button
                                            onClick={handleSkipTimer}
                                            className="p-3 bg-secondary/15 dark:bg-secondary/10 rounded-full hover:bg-secondary/25 transition-colors cursor-pointer text-text-dark dark:text-text-light"
                                            title="Skip to Complete"
                                        >
                                            <FiSquare className="w-5 h-5 fill-current text-red-500" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Persistent Controls */}
                            <div className="flex items-center justify-between pt-6 border-t border-secondary/10 relative">
                                <div className="absolute top-0 left-0 h-1 bg-secondary/10 w-full -mt-[1px]">
                                    <motion.div
                                        className="h-full bg-primary dark:bg-accent"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${((currentStep + 1) / selectedActivity.instructions.length) * 100}%` }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>
                                <button
                                    onClick={handlePrevStep}
                                    disabled={currentStep === 0}
                                    className={`px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${currentStep === 0 ? 'opacity-30 cursor-not-allowed text-text-dark/50' : 'bg-card-light dark:bg-card-dark text-text-dark dark:text-text-light hover:bg-secondary/10 cursor-pointer border border-secondary/20'}`}
                                >
                                    <FiArrowLeft className="w-4 h-4" /> Previous
                                </button>

                                <button
                                    onClick={handleNextStep}
                                    disabled={!canProceed}
                                    className={`px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md ${!canProceed ? 'opacity-40 cursor-not-allowed bg-secondary/50 text-text-dark/80' : 'bg-primary dark:bg-accent text-white hover:scale-105 cursor-pointer'}`}
                                >
                                    {currentStep === selectedActivity.instructions.length - 1 ? 'Complete Session' : 'Continue'}
                                    {currentStep < selectedActivity.instructions.length - 1 && <FiPlay className="w-4 h-4 fill-current" />}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* View 3: Complete Feedback form */}
                    {activeView === 'feedback' && selectedActivity && (
                        <motion.div
                            key="feedback-view"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-[2.5rem] p-6 md:p-10 shadow-sm max-w-xl mx-auto w-full space-y-6"
                        >
                            {/* Header controls: Close button — top right */}
                            <div className="flex items-center justify-end">
                                <button
                                    onClick={() => {
                                        audioEngine.stop();
                                        exitFullscreen();
                                        setActiveView('mission');
                                        setSelectedActivity(null);
                                    }}
                                    title="Close mission"
                                    className="p-2 rounded-xl hover:bg-secondary/10 dark:hover:bg-secondary/5 text-text-dark/50 dark:text-text-light/50 hover:text-text-dark dark:hover:text-text-light transition-colors cursor-pointer"
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>


                            <div className="text-center space-y-2">
                                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <FiCheckSquare className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-dark dark:text-text-light">
                                    Session Completed!
                                </h2>

                                <p className="text-xs sm:text-sm text-text-dark/60 dark:text-text-light/65">
                                    How was your experience during "{selectedActivity.title}"?
                                </p>
                                <div className="mt-3 inline-block px-4 py-2 bg-primary/10 rounded-full">
                                    <p className="text-xs font-bold text-primary dark:text-accent">
                                        🌟 Great consistency. You are actively investing in your mental space.
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleFeedbackSubmit} className="space-y-8 text-left pt-2">
                                {/* Quantitative Sliders (Phase 9) */}
                                <div className="space-y-6">
                                    <div className="bg-secondary/5 border border-secondary/10 p-5 rounded-2xl space-y-4">
                                        <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-text-dark/65 dark:text-text-light/60">
                                            <span>Mood Right Now</span>
                                            <span className="text-primary dark:text-accent font-black text-sm">{moodAfter}/10</span>
                                        </div>
                                        <input
                                            type="range" min="1" max="10" value={moodAfter}
                                            onChange={(e) => setMoodAfter(parseInt(e.target.value))}
                                            className="w-full h-3 bg-secondary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                        <div className="flex justify-between text-xs text-text-dark/40 font-semibold">
                                            <span>😞 Very Low</span>
                                            <span>😊 Excellent</span>
                                        </div>
                                    </div>

                                    <div className="bg-secondary/5 border border-secondary/10 p-5 rounded-2xl space-y-4">
                                        <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-text-dark/65 dark:text-text-light/60">
                                            <span>Stress / Tension</span>
                                            <span className="text-red-500/80 dark:text-red-400 font-black text-sm">{stressAfter}/10</span>
                                        </div>
                                        <input
                                            type="range" min="1" max="10" value={stressAfter}
                                            onChange={(e) => setStressAfter(parseInt(e.target.value))}
                                            className="w-full h-3 bg-secondary/20 rounded-lg appearance-none cursor-pointer accent-red-500"
                                        />
                                        <div className="flex justify-between text-xs text-text-dark/40 font-semibold">
                                            <span>Calm</span>
                                            <span>Overwhelmed</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Free comments */}
                                <div className="space-y-2 pt-2">
                                    <label htmlFor="comments" className="text-[10px] uppercase font-bold tracking-wider text-text-dark/65 dark:text-text-light/60">
                                        Optional Comments
                                    </label>
                                    <textarea
                                        id="comments"
                                        rows="3"
                                        value={feedbackComment}
                                        onChange={(e) => setFeedbackComment(e.target.value)}
                                        placeholder="Add comments on how this method felt today..."
                                        className="w-full rounded-2xl px-4 py-3 text-xs sm:text-sm transition-all duration-200 
                      border outline-none bg-bg-light dark:bg-bg-dark text-text-dark dark:text-text-light
                      border-secondary/20 dark:border-secondary/10 focus:border-secondary focus:ring-1 focus:ring-secondary/35 resize-none leading-relaxed"
                                    />
                                </div>

                                {/* Form Action Buttons */}
                                <div className="pt-2 flex gap-3">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="flex-grow py-3"
                                        disabled={submittingFeedback}
                                    >
                                        {submittingFeedback ? 'Saving Feedback...' : 'Submit Feedback'}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </PageTransition>
    );
};
