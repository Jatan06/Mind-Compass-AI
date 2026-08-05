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

    const [activeView, setActiveView] = useState('list'); // 'list' | 'details' | 'feedback'
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [difficultyFilter, setDifficultyFilter] = useState('All');
    const [durationFilter, setDurationFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const todaysRecommendation = todayRecommendation?.activity || null;
    const recReason = todayRecommendation?.reason
        ? (Array.isArray(todayRecommendation.reason) ? todayRecommendation.reason.join(" ") : todayRecommendation.reason)
        : "";

    // Timer States
    const [timeLeft, setTimeLeft] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    // Feedback States
    const [satisfaction, setSatisfaction] = useState(5);
    const [moodImproved, setMoodImproved] = useState('Yes');
    const [feedbackComment, setFeedbackComment] = useState('');
    const [submittingFeedback, setSubmittingFeedback] = useState(false);

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
        } catch (_) {}
    };

    const exitFullscreen = async () => {
        try {
            if (document.fullscreenElement || document.webkitFullscreenElement) {
                if (document.exitFullscreen) await document.exitFullscreen();
                else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            }
        } catch (_) {}
        try {
            if (wakeLockRef.current) {
                await wakeLockRef.current.release();
                wakeLockRef.current = null;
            }
        } catch (_) {}
    };

    // Exit fullscreen if user presses Escape (browser does it automatically,
    // but we still need to release the wake lock)
    useEffect(() => {
        const onFsChange = () => {
            if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                if (wakeLockRef.current) {
                    wakeLockRef.current.release().catch(() => {});
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

    // Handle Category, Difficulty, Duration filter & Search
    const filteredActivities = activities.filter(a => {
        const matchesCategory = categoryFilter === 'All' || a.category.toLowerCase() === categoryFilter.toLowerCase();
        const matchesDifficulty = difficultyFilter === 'All' || a.difficulty.toLowerCase() === difficultyFilter.toLowerCase();

        const mins = getDurationNum(a.duration);
        const matchesDuration = durationFilter === 'All' ||
            (durationFilter === '< 5 min' && mins < 5) ||
            (durationFilter === '5-10 min' && mins >= 5 && mins <= 10) ||
            (durationFilter === '> 10 min' && mins > 10);

        const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesCategory && matchesDifficulty && matchesDuration && matchesSearch;
    });

    // Timer Control Handlers
    const startTimer = (activity) => {
        setSelectedActivity(activity);
        const mins = getDurationNum(activity.duration) || 5;
        const durSecs = mins * 60;
        setTimeLeft(durSecs);
        setIsTimerRunning(true);
        setActiveView('details');
        // Play category-specific ambient sound for the exact session duration
        const soundscape = getSoundscapeForCategory(activity.category);
        audioEngine.play(soundscape, durSecs);
        // Enter fullscreen + request wake lock (triggered by user click — always succeeds)
        enterFullscreen();
    };

    useEffect(() => {
        if (activeView !== 'details') return;

        let interval = null;
        if (isTimerRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsTimerRunning(false);
            exitFullscreen();
            setActiveView('feedback');
        }

        return () => clearInterval(interval);
    }, [isTimerRunning, timeLeft, activeView]);

    const handleTimerPause = () => {
        setIsTimerRunning(prev => {
            const next = !prev;
            if (next) audioEngine.resume();
            else audioEngine.pause();
            return next;
        });
    };

    const handleTimerReset = () => {
        const mins = getDurationNum(selectedActivity.duration) || 5;
        const durSecs = mins * 60;
        setTimeLeft(durSecs);
        setIsTimerRunning(true);
        // Force restart music completely from 00:00
        const soundscape = getSoundscapeForCategory(selectedActivity.category);
        audioEngine.restart(soundscape, durSecs);
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
                satisfaction,
                moodImproved,
                comment: feedbackComment
            });
            // Reset feedback form states
            setSatisfaction(5);
            setMoodImproved('Yes');
            setFeedbackComment('');
            setActiveView('list');
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
                    {/* View 1: Activitiy Library & Recommendation Card */}
                    {activeView === 'list' && (
                        <motion.div
                            key="library-view"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-8"
                        >
                            {/* Header */}
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-dark dark:text-text-light">
                                    Wellness Library
                                </h1>
                                <p className="text-sm md:text-base text-text-dark/65 dark:text-text-light/70 mt-1">
                                    Find a moment of balance. Select guided breathing, stretching, or daily focus templates.
                                </p>
                            </div>

                            {/* Recommended wellness activity */}
                            {!recLoading && todaysRecommendation && (
                                <div className="bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-[2.5rem] p-6 md:p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row gap-6 items-center">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 dark:bg-accent/5 rounded-full filter blur-3xl pointer-events-none" />
                                    <div className="p-4 bg-primary/10 dark:bg-accent/15 rounded-3xl text-primary dark:text-accent">
                                        <FiCompass className="w-8 h-8 animate-spin-slow" />
                                    </div>
                                    <div className="flex-grow space-y-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-secondary">
                                                TODAY’S CHOSEN RECOMMENDATION
                                            </span>
                                            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded">
                                                Fits Profile
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-text-dark dark:text-text-light">
                                            {todaysRecommendation.title}
                                        </h3>
                                        <p className="text-sm text-text-dark/70 dark:text-text-light/75 leading-relaxed max-w-2xl">
                                            {recReason || "Suggested to help you center and relax today."}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-text-dark/50 dark:text-text-light/50">
                                            <span>Duration: {todaysRecommendation.duration}</span>
                                            <span>Difficulty: {todaysRecommendation.difficulty}</span>
                                            {todaysRecommendation.evidence_level && (
                                                <span className="text-primary dark:text-accent font-semibold">Evidence Level: {todaysRecommendation.evidence_level}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto">
                                        <button
                                            onClick={() => startTimer(todaysRecommendation)}
                                            className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold bg-primary hover:bg-primary-hover dark:bg-accent dark:hover:bg-accent-hover text-bg-light dark:text-bg-dark px-5 py-2.5 rounded-full transition-all cursor-pointer shadow-sm animate-pulse"
                                        >
                                            Start Now
                                            <FiPlay className="w-3.5 h-3.5 fill-current" />
                                        </button>
                                        <button
                                            onClick={() => toggleFavorite(todaysRecommendation.id)}
                                            className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold border border-secondary/25 dark:border-secondary/10 bg-transparent hover:bg-secondary/5 text-text-dark dark:text-text-light px-5 py-2.5 rounded-full transition-all cursor-pointer"
                                        >
                                            {favorites.includes(todaysRecommendation.id) ? 'Favorited' : 'Save for Later'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Section: Categories Filter */}
                            <div className="space-y-4 pt-4 border-t border-secondary/10 dark:border-secondary/5">
                                <div className="flex flex-wrap gap-2">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setCategoryFilter(cat)}
                                            className={`text-xs sm:text-sm px-4 py-2 rounded-full font-semibold transition-all duration-200 outline-none cursor-pointer
                        ${categoryFilter === cat
                                                    ? 'bg-secondary text-bg-light dark:bg-secondary dark:text-text-light shadow-sm font-bold'
                                                    : 'bg-card-light dark:bg-card-dark border border-secondary/20 dark:border-secondary/10 hover:border-secondary/35 text-text-dark/75 dark:text-text-light/80'
                                                }
                      `}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>

                                {/* Filters & Search Row */}
                                <div className="flex flex-col md:flex-row gap-4 items-center justify-between pt-2 border-t border-secondary/10 dark:border-secondary/5">
                                    <input
                                        type="text"
                                        placeholder="Search by title..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full md:w-64 rounded-full px-4 py-2 border outline-none bg-card-light dark:bg-card-dark text-text-dark dark:text-text-light border-secondary/20 focus:border-secondary transition-all text-sm"
                                    />
                                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                                        <select
                                            value={difficultyFilter}
                                            onChange={(e) => setDifficultyFilter(e.target.value)}
                                            className="rounded-full px-4 py-2 border outline-none bg-card-light dark:bg-card-dark text-text-dark dark:text-text-light border-secondary/20 text-xs font-semibold cursor-pointer"
                                        >
                                            <option value="All">All Difficulties</option>
                                            <option value="Beginner">Beginner</option>
                                            <option value="Intermediate">Intermediate</option>
                                            <option value="Advanced">Advanced</option>
                                        </select>
                                        <select
                                            value={durationFilter}
                                            onChange={(e) => setDurationFilter(e.target.value)}
                                            className="rounded-full px-4 py-2 border outline-none bg-card-light dark:bg-card-dark text-text-dark dark:text-text-light border-secondary/20 text-xs font-semibold cursor-pointer"
                                        >
                                            <option value="All">All Durations</option>
                                            <option value="< 5 min">&lt; 5 min</option>
                                            <option value="5-10 min">5-10 min</option>
                                            <option value="> 10 min">&gt; 10 min</option>
                                        </select>
                                    </div>
                                </div>

                                {loading ? (
                                    <div className="py-20 text-center text-sm text-text-dark/50 mr-auto ml-auto dark:text-text-light/50">Loading activity library...</div>
                                ) : error ? (
                                    <div className="py-20 text-center text-sm text-red-500">{error}</div>
                                ) : filteredActivities.length === 0 ? (
                                    <div className="py-20 text-center text-sm text-text-dark/50 dark:text-text-light/50">No activities match your filters.</div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                                        {filteredActivities.map((act) => {
                                            const isFav = favorites.includes(act.id);
                                            return (
                                                <div
                                                    key={act.id}
                                                    className="bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:scale-[1.01] transition-all duration-200 group text-left"
                                                >
                                                    <div>
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className="w-10 h-10 bg-secondary/15 dark:bg-secondary/10 text-primary dark:text-accent rounded-xl flex items-center justify-center">
                                                                {getCategoryIcon(act.category)}
                                                            </div>
                                                            <button
                                                                onClick={() => toggleFavorite(act.id)}
                                                                className={`p-1.5 rounded-lg hover:bg-secondary/10 dark:hover:bg-secondary/5 transition-colors cursor-pointer`}
                                                            >
                                                                <FiHeart className={`w-5 h-5 ${isFav ? 'fill-red-500 text-red-500' : 'text-text-dark/45 dark:text-text-light/50'}`} />
                                                            </button>
                                                        </div>

                                                        <span className="text-[10px] tracking-wider uppercase font-bold text-secondary">
                                                            {act.category}
                                                        </span>
                                                        <h4 className="text-base font-bold text-text-dark dark:text-text-light mt-1 mb-2 group-hover:text-primary dark:group-hover:text-accent transition-colors">
                                                            {act.title}
                                                        </h4>
                                                        <p className="text-xs sm:text-sm text-text-dark/70 dark:text-text-light/75 leading-relaxed line-clamp-3">
                                                            {act.short_description || act.description}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center justify-between border-t border-secondary/10 dark:border-secondary/5 pt-4 mt-6">
                                                        <div className="flex items-center gap-3 text-xs text-text-dark/50 dark:text-text-light/50">
                                                            <span className="flex items-center gap-1"><FiClock /> {act.duration}</span>
                                                            <span className="flex items-center gap-1"><FiAward /> {act.difficulty}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => startTimer(act)}
                                                            className="p-2 bg-primary hover:bg-primary-hover dark:bg-accent dark:hover:bg-accent-hover text-bg-light dark:text-bg-dark rounded-xl flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                                                        >
                                                            <FiPlay className="w-4 h-4 fill-current" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* View 2: Guided Session Detail Player */}
                    {activeView === 'details' && selectedActivity && (
                        <motion.div
                            key="details-view"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-[2.5rem] p-6 md:p-10 shadow-sm max-w-3xl mx-auto w-full space-y-8"
                        >
                            {/* Header / Back */}
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={() => {
                                        setIsTimerRunning(false);
                                        audioEngine.stop();
                                        exitFullscreen();
                                        setActiveView('list');
                                    }}
                                    className="inline-flex items-center gap-1 text-sm font-semibold text-text-dark/65 hover:text-text-dark dark:text-text-light/65 dark:hover:text-text-light cursor-pointer"
                                >
                                    <FiArrowLeft /> Back to Library
                                </button>
                                <span className="bg-secondary/15 dark:bg-secondary/10 text-primary dark:text-accent text-xs font-bold px-3 py-1 rounded-full text-center">
                                    {selectedActivity.category}
                                </span>
                            </div>

                            {/* Session player details */}
                            <div className="text-center space-y-4">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-secondary">
                                    Difficulty: {selectedActivity.difficulty} | Duration: {selectedActivity.duration}
                                </span>
                                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-text-dark dark:text-text-light">
                                    {selectedActivity.title}
                                </h2>
                                <p className="text-sm text-text-dark/65 dark:text-text-light/75 max-w-xl mx-auto leading-relaxed">
                                    {selectedActivity.short_description || selectedActivity.description}
                                </p>
                            </div>

                            {/* Background Ambient Music — plays for the exact timer duration */}
                            <AmbientMusicPlayer
                                category={selectedActivity.category}
                                isTimerRunning={isTimerRunning}
                                durationSeconds={(getDurationNum(selectedActivity.duration) || 5) * 60}
                            />

                            {/* Interactive HUD Circle Timer */}
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

                            {/* Detailed Metadata Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left border-t border-b border-secondary/10 dark:border-secondary/5 py-6">
                                <div className="space-y-3">
                                    {selectedActivity.clinical_purpose && (
                                        <div>
                                            <span className="text-[10px] font-bold text-secondary uppercase block">Clinical Purpose</span>
                                            <p className="text-xs sm:text-sm text-text-dark dark:text-text-light leading-relaxed">{selectedActivity.clinical_purpose}</p>
                                        </div>
                                    )}
                                    {selectedActivity.scientific_benefits && (
                                        <div>
                                            <span className="text-[10px] font-bold text-secondary uppercase block">Scientific Benefits</span>
                                            <p className="text-xs sm:text-sm text-text-dark dark:text-text-light leading-relaxed">{selectedActivity.scientific_benefits}</p>
                                        </div>
                                    )}
                                    {selectedActivity.evidence_level && (
                                        <div>
                                            <span className="text-[10px] font-bold text-secondary uppercase block">Evidence Level</span>
                                            <p className="text-xs sm:text-sm text-text-dark dark:text-text-light"><span className="bg-primary/10 dark:bg-accent/15 px-2.5 py-0.5 rounded text-primary dark:text-accent font-bold mt-1 inline-block">{selectedActivity.evidence_level}</span></p>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    {selectedActivity.setting && (
                                        <div>
                                            <span className="text-[10px] font-bold text-secondary uppercase block">Setting</span>
                                            <p className="text-xs sm:text-sm text-text-dark dark:text-text-light">{selectedActivity.setting}</p>
                                        </div>
                                    )}
                                    {selectedActivity.format && (
                                        <div>
                                            <span className="text-[10px] font-bold text-secondary uppercase block">Format</span>
                                            <p className="text-xs sm:text-sm text-text-dark dark:text-text-light">{selectedActivity.format}</p>
                                        </div>
                                    )}
                                    {selectedActivity.equipment && (
                                        <div>
                                            <span className="text-[10px] font-bold text-secondary uppercase block">Equipment Required</span>
                                            <p className="text-xs sm:text-sm text-text-dark dark:text-text-light">{selectedActivity.equipment}</p>
                                        </div>
                                    )}
                                    {selectedActivity.precautions && (
                                        <div>
                                            <span className="text-[10px] font-bold text-amber-500 uppercase block">Precautions & Contraindications</span>
                                            <p className="text-xs sm:text-sm text-text-dark dark:text-text-light leading-relaxed">{selectedActivity.precautions}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Guidelines instructions box */}
                            <div className="bg-secondary/5 dark:bg-secondary/5 border border-secondary/15 dark:border-secondary/5 rounded-3xl p-6 text-left space-y-4">
                                <h4 className="text-xs uppercase font-bold tracking-wider text-secondary">
                                    Step-by-Step Instructions
                                </h4>
                                <ol className="space-y-2.5 text-xs sm:text-sm text-text-dark/80 dark:text-text-light/85 list-decimal pl-4 leading-relaxed font-normal">
                                    {(selectedActivity.instructions || []).map((inst, i) => (
                                        <li key={i}>{inst}</li>
                                    ))}
                                </ol>
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
                            {/* Close button — top right */}
                            <div className="flex justify-end">
                                <button
                                    onClick={() => {
                                        audioEngine.stop();
                                        exitFullscreen();
                                        setActiveView('list');
                                        setSelectedActivity(null);
                                    }}
                                    title="Close and return to activities"
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
                            </div>

                            <form onSubmit={handleFeedbackSubmit} className="space-y-6 text-left">
                                {/* Stars ratings */}
                                <div className="space-y-2 text-center">
                                    <label className="text-[10px] uppercase font-bold tracking-wider text-text-dark/65 dark:text-text-light/60">
                                        Was this activity helpful?
                                    </label>
                                    <div className="flex justify-center gap-2 pt-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setSatisfaction(star)}
                                                className="p-1 focus:outline-none cursor-pointer hover:scale-110 transition-transform"
                                            >
                                                <FiStar className={`w-8 h-8 ${star <= satisfaction ? 'fill-amber-400 text-amber-400' : 'text-text-dark/30'}`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Mood improved options */}
                                <div className="space-y-3 pt-2">
                                    <label className="text-[10px] uppercase font-bold tracking-wider text-text-dark/65 dark:text-text-light/60 block">
                                        Did you feel better?
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['Yes', 'A Little', 'No Change'].map((opt) => {
                                            const isSelected = moodImproved === opt;
                                            return (
                                                <button
                                                    key={opt}
                                                    type="button"
                                                    onClick={() => setMoodImproved(opt)}
                                                    className={`py-2 px-4 rounded-xl border text-xs sm:text-sm font-semibold transition-all focus:outline-none cursor-pointer text-center
                             ${isSelected
                                                            ? 'bg-secondary/15 border-secondary text-primary dark:text-accent font-bold scale-102'
                                                            : 'bg-transparent border-secondary/10 dark:border-secondary/5 hover:border-secondary/20'
                                                        }
                           `}
                                                >
                                                    {opt === 'Yes' ? '😊 Yes' : opt === 'A Little' ? '🙂 A Little' : '😐 No Change'}
                                                </button>
                                            );
                                        })}
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
