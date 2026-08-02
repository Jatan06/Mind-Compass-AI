import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiChevronRight, FiSmile, FiAlertCircle } from 'react-icons/fi';
import { PageTransition } from '../components/PageTransition';
import { Button } from '../components/Button';
import { useApp } from '../context/AppContext';

export const DailyCheckIn = () => {
    const navigate = useNavigate();
    const { addCheckin, checkins } = useApp();

    const [mood, setMood] = useState(null); // null (not selected) by default
    const [stress, setStress] = useState(0);
    const [energy, setEnergy] = useState(0);
    const [sleep, setSleep] = useState(0);
    const [productivity, setProductivity] = useState(0);
    const [social, setSocial] = useState(0);
    const [notes, setNotes] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const moods = [
        { value: 1, emoji: '😞', label: 'Down', desc: 'Feeling low or flat' },
        { value: 2, emoji: '😐', label: 'Neutral', desc: 'Okay, just normal' },
        { value: 3, emoji: '🙂', label: 'Good', desc: 'Positive, stable' },
        { value: 4, emoji: '😊', label: 'Happy', desc: 'Joyful, at peace' },
        { value: 5, emoji: '🤩', label: 'Excellent', desc: 'Inspired, high energy' }
    ];

    const getLocalDateString = (d = new Date()) => {
        const offset = d.getTimezoneOffset();
        const localDate = new Date(d.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().split('T')[0];
    };

    const todayStr = getLocalDateString();
    const todaysCheckin = checkins ? checkins.find(c => c.date === todayStr) : null;

    React.useEffect(() => {
        if (todaysCheckin) {
            setMood(todaysCheckin.mood);
            setStress(todaysCheckin.stress);
            setEnergy(todaysCheckin.energy);
            setSleep(todaysCheckin.sleep);
            setProductivity(todaysCheckin.productivity);
            setSocial(todaysCheckin.social);
            setNotes(todaysCheckin.notes || '');
        } else {
            setMood(null);
            setStress(0);
            setEnergy(0);
            setSleep(0);
            setProductivity(0);
            setSocial(0);
            setNotes('');
        }
    }, [todaysCheckin]);

    const currentMoodObj = moods.find(m => m.value === mood) || null;

    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        const getLocalDateString = (d = new Date()) => {
            const offset = d.getTimezoneOffset();
            const localDate = new Date(d.getTime() - (offset * 60 * 1000));
            return localDate.toISOString().split('T')[0];
        };

        try {
            await addCheckin({
                date: getLocalDateString(),
                mood,
                moodLabel: currentMoodObj.label,
                stress,
                energy,
                sleep: parseFloat(sleep),
                productivity,
                social,
                notes
            });
            setShowSuccess(true);
        } catch (err) {
            console.error('Failed to save daily check-in:', err);
            const errMsg = err.response?.data?.error || err.response?.data?.detail || err.message || 'Failed to submit check-in. Please try again.';
            setError(errMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <PageTransition>
            <div className="flex-grow flex flex-col max-w-3xl mx-auto w-full text-left relative">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-dark dark:text-text-light">
                        Daily Check-in
                    </h1>
                    <p className="text-sm md:text-base text-text-dark/65 dark:text-text-light/70 mt-1">
                        Map your current head space. It takes less than a minute.
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {!showSuccess ? (
                        <motion.form
                            key="checkin-form"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            onSubmit={handleSubmit}
                            className="bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-[2.5rem] p-6 md:p-10 shadow-sm space-y-8"
                        >
                            {/* 1. Mood Emoji Selector */}
                            <div className="space-y-4">
                                <label className="text-xs uppercase font-bold tracking-wider text-text-dark/60 dark:text-text-light/60">
                                    How are you feeling right now?
                                </label>
                                <div className="grid grid-cols-5 gap-2.5 sm:gap-4">
                                    {moods.map((m) => {
                                        const isSelected = mood === m.value;
                                        return (
                                            <button
                                                key={m.value}
                                                type="button"
                                                onClick={() => setMood(m.value)}
                                                disabled={isSubmitting || !!todaysCheckin}
                                                className={`flex flex-col items-center p-3 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all duration-200 focus:outline-none
                          ${isSelected
                                                        ? 'bg-secondary/15 border-secondary dark:bg-secondary/10 shadow-sm scale-[1.02]'
                                                        : 'bg-transparent border-secondary/10 dark:border-secondary/5 hover:border-secondary/30'
                                                    }
                          ${todaysCheckin ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}
                        `}
                                            >
                                                <span className="text-3xl sm:text-4xl select-none">{m.emoji}</span>
                                                <span className="text-[10px] sm:text-xs font-bold mt-2 text-text-dark/80 dark:text-text-light/85">
                                                    {m.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="text-center p-3.5 bg-secondary/5 dark:bg-secondary/5 rounded-2xl text-xs text-text-dark/60 dark:text-text-light/60">
                                    Selected Mood: <span className="font-semibold text-text-dark dark:text-text-light">{currentMoodObj ? currentMoodObj.label : 'None'}</span> {currentMoodObj ? `– ${currentMoodObj.desc}` : ''}
                                </div>
                            </div>

                            {/* 2. Sliders Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-secondary/10 dark:border-secondary/5">
                                {/* Stress Slider */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-text-dark/65 dark:text-text-light/60">
                                        <span>Stress Level</span>
                                        <span className="text-primary dark:text-accent font-mono">{stress}/10</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="10"
                                        value={stress}
                                        onChange={(e) => setStress(parseInt(e.target.value))}
                                        disabled={!!todaysCheckin}
                                        className="w-full accent-primary dark:accent-accent bg-secondary/15 dark:bg-secondary/5 rounded-lg h-2 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    <div className="flex justify-between text-[10px] text-text-dark/50 dark:text-text-light/50">
                                        <span>Complete Calm</span>
                                        <span>Highly Stressed</span>
                                    </div>
                                </div>

                                {/* Energy Slider */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-text-dark/65 dark:text-text-light/60">
                                        <span>Energy & Focus</span>
                                        <span className="text-primary dark:text-accent font-mono">{energy}/10</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="10"
                                        value={energy}
                                        onChange={(e) => setEnergy(parseInt(e.target.value))}
                                        disabled={!!todaysCheckin}
                                        className="w-full accent-primary dark:accent-accent bg-secondary/15 dark:bg-secondary/5 rounded-lg h-2 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    <div className="flex justify-between text-[10px] text-text-dark/50 dark:text-text-light/50">
                                        <span>Exhausted</span>
                                        <span>Fully Rested</span>
                                    </div>
                                </div>

                                {/* Sleep Hours Slider */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-text-dark/65 dark:text-text-light/60">
                                        <span>Sleep Duration</span>
                                        <span className="text-primary dark:text-accent font-mono">{sleep} Hours</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="12"
                                        step="0.5"
                                        value={sleep}
                                        onChange={(e) => setSleep(parseFloat(e.target.value))}
                                        disabled={!!todaysCheckin}
                                        className="w-full accent-primary dark:accent-accent bg-secondary/15 dark:bg-secondary/5 rounded-lg h-2 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    <div className="flex justify-between text-[10px] text-text-dark/50 dark:text-text-light/50">
                                        <span>0 hrs</span>
                                        <span>12 hrs</span>
                                    </div>
                                </div>

                                {/* Productivity Slider */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-text-dark/65 dark:text-text-light/60">
                                        <span>Productivity</span>
                                        <span className="text-primary dark:text-accent font-mono">{productivity}/10</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="10"
                                        value={productivity}
                                        onChange={(e) => setProductivity(parseInt(e.target.value))}
                                        disabled={!!todaysCheckin}
                                        className="w-full accent-primary dark:accent-accent bg-secondary/15 dark:bg-secondary/5 rounded-lg h-2 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    <div className="flex justify-between text-[10px] text-text-dark/50 dark:text-text-light/50">
                                        <span>Distracted</span>
                                        <span>Highly Flowing</span>
                                    </div>
                                </div>

                                {/* Social Interactions */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-text-dark/65 dark:text-text-light/60">
                                        <span>Social Connection</span>
                                        <span className="text-primary dark:text-accent font-mono">{social}/10</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="10"
                                        value={social}
                                        onChange={(e) => setSocial(parseInt(e.target.value))}
                                        disabled={!!todaysCheckin}
                                        className="w-full accent-primary dark:accent-accent bg-secondary/15 dark:bg-secondary/5 rounded-lg h-2 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    <div className="flex justify-between text-[10px] text-text-dark/50 dark:text-text-light/50">
                                        <span>Isolated</span>
                                        <span>Fully Engaged</span>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Text Notes */}
                            <div className="space-y-3 pt-4 border-t border-secondary/10 dark:border-secondary/5">
                                <label htmlFor="notes" className="text-xs uppercase font-bold tracking-wider text-text-dark/60 dark:text-text-light/60">
                                    Optional Notes
                                </label>
                                <textarea
                                    id="notes"
                                    rows="3"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    disabled={!!todaysCheckin}
                                    placeholder="Write a brief line about your day (e.g. coffee counts, meeting pressure, light walks...)"
                                    className="w-full rounded-2xl px-4 py-3 text-sm transition-all duration-200 
                     border outline-none bg-card-light dark:bg-card-dark text-text-dark dark:text-text-light
                     border-secondary/20 dark:border-secondary/10 focus:border-secondary focus:ring-1 focus:ring-secondary/35 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </div>

                            {error && (
                                <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl text-xs sm:text-sm border border-red-500/15 flex items-center gap-2">
                                    <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {todaysCheckin && (
                                <div className="p-4 bg-primary/10 text-primary dark:bg-accent/10 dark:text-accent rounded-2xl text-xs sm:text-sm border border-primary/15 dark:border-accent/15 flex items-center gap-2">
                                    <FiCheckCircle className="w-5 h-5 flex-shrink-0" />
                                    <div>
                                        <p className="font-bold">You've already completed today's mood check-in.</p>
                                        <p className="text-[11px] opacity-80 mt-0.5">Next check-in available tomorrow.</p>
                                    </div>
                                </div>
                            )}

                            {/* Submit */}
                            <div className="pt-4 flex justify-end">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="lg"
                                    disabled={isSubmitting || mood === null || !!todaysCheckin}
                                >
                                    {isSubmitting ? 'Logging Headspace...' : 'Save Check-in'}
                                </Button>
                            </div>
                        </motion.form>
                    ) : (
                        <motion.div
                            key="checkin-success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-[2.5rem] p-10 shadow-sm text-center space-y-6 max-w-lg mx-auto"
                        >
                            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                                <FiCheckCircle className="w-8 h-8" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl sm:text-2xl font-bold text-text-dark dark:text-text-light">
                                    Check-in Saved
                                </h3>
                                <p className="text-sm text-text-dark/65 dark:text-text-light/75 leading-relaxed">
                                    Your mood profile is updated. Taking small daily assessments helps build an accurate emotional map of your week.
                                </p>
                            </div>
                            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                                <button
                                    onClick={() => navigate('/app')}
                                    className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold bg-primary hover:bg-primary-hover dark:bg-accent dark:hover:bg-accent-hover text-bg-light dark:text-bg-dark px-5 py-2.5 rounded-full transition-all cursor-pointer shadow-sm"
                                >
                                    Go to Dashboard
                                    <FiChevronRight />
                                </button>
                                <button
                                    onClick={() => navigate('/app/wellness')}
                                    className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold border border-secondary/25 dark:border-secondary/10 bg-transparent hover:bg-secondary/5 text-text-dark dark:text-text-light px-5 py-2.5 rounded-full transition-all cursor-pointer"
                                >
                                    Explore Recommended Exercises
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </PageTransition>
    );
};
