import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    FiUser,
    FiSettings,
    FiActivity,
    FiAlertTriangle,
    FiCheckSquare,
    FiPlus,
    FiX,
    FiBell,
    FiVolume2
} from 'react-icons/fi';
import { PageTransition } from '../components/PageTransition';
import { Button } from '../components/Button';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

export const Profile = () => {
    const { userProfile, updateProfile, retakeAssessment } = useApp();
    const navigate = useNavigate();

    const [name, setName] = useState(userProfile.name);
    const [email, setEmail] = useState(userProfile.email);
    const [voicePreference, setVoicePreference] = useState(userProfile.voicePreference);
    const [notifications, setNotifications] = useState(userProfile.notifications);

    const [goals, setGoals] = useState(userProfile.goals);
    const [newGoal, setNewGoal] = useState('');

    const [triggers, setTriggers] = useState(userProfile.triggers);
    const [newTrigger, setNewTrigger] = useState('');

    const [copingMethods, setCopingMethods] = useState(userProfile.copingMethods);
    const [newCoping, setNewCoping] = useState('');

    const handleAddGoal = (e) => {
        e.preventDefault();
        if (newGoal.trim() && !goals.includes(newGoal.trim())) {
            setGoals([...goals, newGoal.trim()]);
            setNewGoal('');
        }
    };

    const handleRemoveGoal = (goalToRemove) => {
        setGoals(goals.filter(g => g !== goalToRemove));
    };

    const handleAddTrigger = (e) => {
        e.preventDefault();
        if (newTrigger.trim() && !triggers.includes(newTrigger.trim())) {
            setTriggers([...triggers, newTrigger.trim()]);
            setNewTrigger('');
        }
    };

    const handleRemoveTrigger = (triggerToRemove) => {
        setTriggers(triggers.filter(t => t !== triggerToRemove));
    };

    const handleAddCoping = (e) => {
        e.preventDefault();
        if (newCoping.trim() && !copingMethods.includes(newCoping.trim())) {
            setCopingMethods([...copingMethods, newCoping.trim()]);
            setNewCoping('');
        }
    };

    const handleRemoveCoping = (copingToRemove) => {
        setCopingMethods(copingMethods.filter(c => c !== copingToRemove));
    };

    const handleNotificationToggle = (key) => {
        setNotifications(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleSave = (e) => {
        e.preventDefault();
        updateProfile({
            name,
            email,
            goals,
            triggers,
            copingMethods,
            notifications,
            voicePreference
        });
        alert('Profile configuration updated successfully.');
    };

    const handleRetakeAssessment = async () => {
        const confirmed = window.confirm(
            "Are you sure you want to retake the onboarding assessment? This will reset your profile configurations and redirect you to the assessment wizard."
        );
        if (confirmed) {
            try {
                await retakeAssessment();
                navigate('/app/onboarding');
            } catch (err) {
                alert("Failed to reset onboarding status: " + (err.response?.data?.error || err.message));
            }
        }
    };

    return (
        <PageTransition>
            <div className="flex-grow flex flex-col gap-6 text-left max-w-4xl mx-auto w-full">
                {/* Header */}
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-dark dark:text-text-light">
                        Profile & Settings
                    </h1>
                    <p className="text-sm md:text-base text-text-dark/65 dark:text-text-light/70 mt-1">
                        Optimize triggers, set voice guides preferences, and adjust coping methods database.
                    </p>
                </div>

                <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left: General Settings Details */}
                    <div className="lg:col-span-6 space-y-6">
                        <div className="bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-6">
                            <h3 className="text-lg font-bold text-text-dark dark:text-text-light flex items-center gap-2">
                                <FiUser className="text-secondary" />
                                Personal Info
                            </h3>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-[10px] uppercase font-bold tracking-wider text-text-dark/50 dark:text-text-light/50">
                                        Preferred Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full rounded-2xl px-4 py-3 text-sm transition-all border outline-none bg-bg-light dark:bg-bg-dark text-text-dark dark:text-text-light border-secondary/20 dark:border-secondary/10 focus:border-secondary"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-[10px] uppercase font-bold tracking-wider text-text-dark/50 dark:text-text-light/50">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full rounded-2xl px-4 py-3 text-sm transition-all border outline-none bg-bg-light dark:bg-bg-dark text-text-dark dark:text-text-light border-secondary/20 dark:border-secondary/10 focus:border-secondary"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* System Preference Settings */}
                        <div className="bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-6">
                            <h3 className="text-lg font-bold text-text-dark dark:text-text-light flex items-center gap-2">
                                <FiSettings className="text-secondary" />
                                System Preferences
                            </h3>

                            {/* Voice Preference Selector */}
                            <div className="space-y-3">
                                <label className="text-[10px] uppercase font-bold tracking-wider text-text-dark/50 dark:text-text-light/50 flex items-center gap-1.5">
                                    <FiVolume2 className="text-secondary" />
                                    Guide Audio Tone
                                </label>
                                <select
                                    value={voicePreference}
                                    onChange={(e) => setVoicePreference(e.target.value)}
                                    className="w-full rounded-2xl px-4 py-3 text-sm bg-bg-light dark:bg-bg-dark border border-secondary/20 dark:border-secondary/10 text-text-dark dark:text-text-light outline-none"
                                >
                                    <option value="calm-female">Calm & Gentle (Female)</option>
                                    <option value="deep-male">Warm & Deep (Male)</option>
                                    <option value="ocean-whisper">Soft Ambient Whisper</option>
                                </select>
                            </div>

                            {/* Notifications checklist */}
                            <div className="space-y-4 pt-4 border-t border-secondary/10 dark:border-secondary/5">
                                <label className="text-[10px] uppercase font-bold tracking-wider text-text-dark/50 dark:text-text-light/50 flex items-center gap-1.5">
                                    <FiBell className="text-secondary" />
                                    Daily Notifications
                                </label>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 text-sm cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={notifications.dailyCheckin}
                                            onChange={() => handleNotificationToggle('dailyCheckin')}
                                            className="w-4.5 h-4.5 accent-primary rounded cursor-pointer"
                                        />
                                        <span>Daily morning check-in reminder</span>
                                    </label>
                                    <label className="flex items-center gap-3 text-sm cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={notifications.weeklySummary}
                                            onChange={() => handleNotificationToggle('weeklySummary')}
                                            className="w-4.5 h-4.5 accent-primary rounded cursor-pointer"
                                        />
                                        <span>Weekly emotional twin metrics summary</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Personalizing Triggers & Coping Methods */}
                    <div className="lg:col-span-6 space-y-6">
                        {/* Wellness Goals */}
                        <div className="bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-4">
                            <h3 className="text-lg font-bold text-text-dark dark:text-text-light flex items-center gap-2">
                                <FiActivity className="text-secondary" />
                                Wellness Goals
                            </h3>

                            {/* Inputs list */}
                            <div className="flex flex-wrap gap-2 pt-1">
                                {goals.map((g, i) => (
                                    <span key={i} className="text-xs bg-primary/10 text-primary dark:bg-accent/15 dark:text-accent font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                        {g}
                                        <button type="button" onClick={() => handleRemoveGoal(g)} className="hover:text-red-500 cursor-pointer">
                                            <FiX className="w-3.5 h-3.5" />
                                        </button>
                                    </span>
                                ))}
                            </div>

                            {/* Input trigger form */}
                            <div className="flex gap-2 pt-2">
                                <input
                                    type="text"
                                    placeholder="Add new goal..."
                                    value={newGoal}
                                    onChange={(e) => setNewGoal(e.target.value)}
                                    className="flex-grow rounded-xl px-3 py-2 text-xs border outline-none bg-bg-light dark:bg-bg-dark text-text-dark dark:text-text-light border-secondary/20 dark:border-secondary/10"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddGoal}
                                    className="p-2 sm:p-2.5 bg-primary dark:bg-accent text-bg-light dark:text-bg-dark rounded-xl flex items-center justify-center cursor-pointer"
                                >
                                    <FiPlus />
                                </button>
                            </div>
                        </div>

                        {/* Anxieties Triggers */}
                        <div className="bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-4">
                            <h3 className="text-lg font-bold text-text-dark dark:text-text-light flex items-center gap-2">
                                <FiAlertTriangle className="text-secondary" />
                                Emotional Triggers
                            </h3>

                            <div className="flex flex-wrap gap-2 pt-1">
                                {triggers.map((t, i) => (
                                    <span key={i} className="text-xs bg-amber-500/10 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                        {t}
                                        <button type="button" onClick={() => handleRemoveTrigger(t)} className="hover:text-red-500 cursor-pointer">
                                            <FiX className="w-3.5 h-3.5" />
                                        </button>
                                    </span>
                                ))}
                            </div>

                            <div className="flex gap-2 pt-2">
                                <input
                                    type="text"
                                    placeholder="Add new trigger..."
                                    value={newTrigger}
                                    onChange={(e) => setNewTrigger(e.target.value)}
                                    className="flex-grow rounded-xl px-3 py-2 text-xs border outline-none bg-bg-light dark:bg-bg-dark text-text-dark dark:text-text-light border-secondary/20 dark:border-secondary/10"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddTrigger}
                                    className="p-2 sm:p-2.5 bg-primary dark:bg-accent text-bg-light dark:text-bg-dark rounded-xl flex items-center justify-center cursor-pointer"
                                >
                                    <FiPlus />
                                </button>
                            </div>
                        </div>

                        {/* Coping Methods */}
                        <div className="bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-4">
                            <h3 className="text-lg font-bold text-text-dark dark:text-text-light flex items-center gap-2">
                                <FiCheckSquare className="text-secondary" />
                                Coping Methods
                            </h3>

                            <div className="flex flex-wrap gap-2 pt-1">
                                {copingMethods.map((c, i) => (
                                    <span key={i} className="text-xs bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                        {c}
                                        <button type="button" onClick={() => handleRemoveCoping(c)} className="hover:text-red-500 cursor-pointer">
                                            <FiX className="w-3.5 h-3.5" />
                                        </button>
                                    </span>
                                ))}
                            </div>

                            <div className="flex gap-2 pt-2">
                                <input
                                    type="text"
                                    placeholder="Add new coping method..."
                                    value={newCoping}
                                    onChange={(e) => setNewCoping(e.target.value)}
                                    className="flex-grow rounded-xl px-3 py-2 text-xs border outline-none bg-bg-light dark:bg-bg-dark text-text-dark dark:text-text-light border-secondary/20 dark:border-secondary/10"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddCoping}
                                    className="p-2 sm:p-2.5 bg-primary dark:bg-accent text-bg-light dark:text-bg-dark rounded-xl flex items-center justify-center cursor-pointer"
                                >
                                    <FiPlus />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Save Action Button */}
                    <div className="col-span-1 lg:col-span-12 flex justify-between items-center pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleRetakeAssessment}
                            className="text-red-500 hover:text-red-600 border border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                            Retake Assessment
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            className="px-8"
                        >
                            Save Settings
                        </Button>
                    </div>
                </form>
            </div>
        </PageTransition>
    );
};
