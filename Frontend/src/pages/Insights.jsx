import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiTrendingUp,
    FiSmile,
    FiActivity,
    FiMoon,
    FiAlertTriangle,
    FiZap,
    FiCompass,
    FiHeart,
    FiCheckCircle,
    FiUsers
} from 'react-icons/fi';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend
} from 'recharts';
import { PageTransition } from '../components/PageTransition';
import { useApp } from '../context/AppContext';
import { insightsAPI, aiAPI } from '../services/api';
import { AICompanion } from '../components/AICompanion';

export const Insights = () => {
    const { wellnessScore, aiInsightsData, insightsLoading, analyticsData, analyticsLoading, refreshDashboardData, userProfile } = useApp();
    const [insightsTab, setInsightsTab] = useState('twin'); // 'twin' | 'analytics'

    const [error, setError] = useState('');

    useEffect(() => {
        refreshDashboardData();
    }, [refreshDashboardData]);

    const loading = insightsLoading || analyticsLoading;

    if (loading) {
        return (
            <div className="flex-grow flex items-center justify-center py-20 text-xs sm:text-sm text-text-dark/50 dark:text-text-light/50">
                Loading your insights...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-grow flex items-center justify-center py-20 text-xs sm:text-sm text-red-500">
                {error}
            </div>
        );
    }

    if (analyticsData?.insufficient_data) {
        return (
            <PageTransition>
                <div className="flex-grow flex flex-col gap-6 text-left max-w-5xl mx-auto w-full pt-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-dark dark:text-text-light flex items-center gap-2.5">
                            Mind Insights
                            <AICompanion userProfile={userProfile} wellnessScore={wellnessScore} />
                        </h1>
                        <p className="text-sm md:text-base text-text-dark/65 dark:text-text-light/70 mt-1">
                            A professional, personalized look at your mental metrics.
                        </p>
                    </div>
                    <div className="bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-[2.5rem] p-12 text-center shadow-sm space-y-6">
                        <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto">
                            <FiAlertTriangle className="w-8 h-8 pointer-events-none" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-text-dark dark:text-text-light">
                                More data is needed to generate meaningful insights
                            </h3>
                            <p className="text-sm text-text-dark/65 dark:text-text-light/70 max-w-md mx-auto leading-relaxed">
                                Complete at least three daily mood check-ins and log journal entries to build a baseline and unlock your AI Emotional Twin and Progress Analytics.
                            </p>
                        </div>
                    </div>
                </div>
            </PageTransition>
        );
    }

    // Format week-to-week data for charts
    const chartData = (analyticsData?.moodTrends || []).map(t => {
        return {
            name: t.date,
            Mood: t.mood,
            Stress: t.stress,
            Sleep: t.sleep,
            Productivity: t.productivity != null ? t.productivity : null
        };
    });

    // Extract cognitive themes
    const themesList = aiInsightsData?.cognitive_distortions?.length > 0 && !aiInsightsData.pending
        ? aiInsightsData.cognitive_distortions.map(d => ({ theme: d, value: 1 }))
        : (analyticsData?.cognitiveThemes || []);

    // Synthesize summaries dynamically based on analyticsData and aiInsightsData
    const summaries = {
        weeklySummary: aiInsightsData?.pending
            ? aiInsightsData.detail
            : (aiInsightsData?.weekly_summary || `Over the past logged period, your emotional twin registered an average mood rating of ${analyticsData?.summary?.averageMood || 3.0}/5.0. Stress patterns normalized around ${analyticsData?.summary?.averageStress || 5.0}/10.0. Sleep quality tracked at ${analyticsData?.summary?.averageSleep || 7.0} hours. Core emotional states remained largely ${analyticsData?.summary?.moodTrend || 'stable'}.`),
        bestHabit: aiInsightsData?.supporting_habit || `${analyticsData?.summary?.averageSleep || 7.0} hours of average sleep time. Higher sleep duration correlates with increased daytime focus and emotional resilience.`,
        improvementNeed: aiInsightsData?.pending
            ? "Complete today's check-in and journal to view active focus areas."
            : (aiInsightsData?.primary_focus_area
                ? `Active Focus Area: ${aiInsightsData.primary_focus_area}. Complete regular checkins to sustain your progress.`
                : (aiInsightsData?.focus_areas?.length > 0
                    ? `Active Focus Area: ${aiInsightsData.focus_areas[0]}. Complete regular checkins to sustain your progress.`
                    : `Managing stress and restoring rest boundaries. Complete daily coping activities to help sustain your progress.`))
    };

    return (
        <PageTransition>
            <div className="flex-grow flex flex-col gap-6 text-left max-w-5xl mx-auto w-full">
                {/* Header & Tabs Switcher */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-dark dark:text-text-light flex items-center gap-2.5">
                            Mind Insights
                            <AICompanion userProfile={userProfile} wellnessScore={wellnessScore} />
                        </h1>
                        <p className="text-sm md:text-base text-text-dark/65 dark:text-text-light/70 mt-1">
                            A professional, personalized look at your mental metrics.
                        </p>
                    </div>

                    <div className="flex border border-secondary/15 dark:border-secondary/5 rounded-full p-1 bg-card-light dark:bg-card-dark select-none shadow-sm">
                        <button
                            onClick={() => setInsightsTab('twin')}
                            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-full transition-all cursor-pointer outline-none
                ${insightsTab === 'twin'
                                    ? 'bg-primary text-bg-light dark:bg-accent dark:text-bg-dark font-bold'
                                    : 'text-text-dark/75 dark:text-text-light/80 hover:text-primary dark:hover:text-accent'
                                }
              `}
                        >
                            AI Emotional Twin
                        </button>
                        <button
                            onClick={() => setInsightsTab('analytics')}
                            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-full transition-all cursor-pointer outline-none
                ${insightsTab === 'analytics'
                                    ? 'bg-primary text-bg-light dark:bg-accent dark:text-bg-dark font-bold'
                                    : 'text-text-dark/75 dark:text-text-light/80 hover:text-primary dark:hover:text-accent'
                                }
              `}
                        >
                            Progress Analytics
                        </button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {/* Panel 1: Signature AI Emotional Twin */}
                    {insightsTab === 'twin' && (
                        <motion.div
                            key="twin-panel"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {/* Twin Top Row */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                                {/* Left: Dynamic Infographic Profile */}
                                <div className="md:col-span-5 bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-[2.5rem] p-6 md:p-8 flex flex-col justify-between shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 dark:bg-accent/5 rounded-full filter blur-2xl pointer-events-none" />
                                    <div>
                                        <h3 className="text-lg font-bold text-text-dark dark:text-text-light flex items-center gap-2 mb-2">
                                            <FiCompass className="w-5 h-5 text-secondary animate-spin-slow" />
                                            Active Twin Profile
                                        </h3>
                                        <span className="text-[10px] tracking-wider uppercase font-bold text-secondary">
                                            COGNITIVE LANDSCAPE: {aiInsightsData?.profile_state ? aiInsightsData.profile_state.toUpperCase() : (analyticsData.summary?.moodTrend ? analyticsData.summary.moodTrend.toUpperCase() : 'STEADY BALANCE')}
                                        </span>
                                    </div>

                                    {/* Abstract Graphic representing the twin shape */}
                                    <div className="py-6 flex justify-center items-center">
                                        <div className="relative w-36 h-36 flex items-center justify-center">
                                            {/* Outer Ring */}
                                            <svg className="w-full h-full transform -rotate-90">
                                                <circle cx="72" cy="72" r="60" stroke="currentColor" strokeWidth="6" className="text-secondary/15 dark:text-secondary/5" fill="transparent" />
                                                <circle
                                                    cx="72"
                                                    cy="72"
                                                    r="60"
                                                    stroke="currentColor"
                                                    strokeWidth="7"
                                                    className="text-primary dark:text-accent"
                                                    fill="transparent"
                                                    strokeDasharray={2 * Math.PI * 60}
                                                    strokeDashoffset={2 * Math.PI * 60 * (1 - wellnessScore / 100)}
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            {/* Score Overlay */}
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-2xl font-bold font-mono leading-none">{wellnessScore}%</span>
                                                <span className="text-[9px] tracking-wider uppercase font-bold text-text-dark/50 dark:text-text-light/50 mt-1">WELLNESS STATUS</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Brief descriptor of recovery patterns */}
                                    <div className="p-4 bg-secondary/5 dark:bg-secondary/5 border border-secondary/10 rounded-2xl text-xs sm:text-sm leading-relaxed text-text-dark/75 dark:text-text-light/80">
                                        <span className="font-bold block mb-1">RECOVERY SPECTRUM</span>
                                        {aiInsightsData?.recovery_spectrum || analyticsData?.recoverySpectrum || "Continue logging your progress to unlock personalized recovery insights."}
                                    </div>
                                </div>

                                {/* Right: Twin Bullet Cards Info */}
                                <div className="md:col-span-7 flex flex-col gap-6">
                                    {/* Emotional Summary Card */}
                                    <div className="bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-[2.5rem] p-6 md:p-8 text-left shadow-sm space-y-4">
                                        <span className="text-xs uppercase font-extrabold text-secondary tracking-widest block">
                                            TODAY’S EMOTIONAL SPECTRUM
                                        </span>
                                        <p className="text-sm sm:text-base leading-relaxed text-text-dark/85 dark:text-text-light/90 font-light">
                                            "{summaries.weeklySummary}"
                                        </p>
                                    </div>

                                    {/* Best Coping and Triggers Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {/* Dynamic themes count list */}
                                        <div className="bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between">
                                            <div className="space-y-3 text-left">
                                                <h4 className="text-xs font-extrabold uppercase tracking-wider text-text-dark/50 dark:text-text-light/50 flex items-center gap-1.5">
                                                    <FiAlertTriangle className="text-amber-500" />
                                                    Logged Themes
                                                </h4>
                                                {themesList && themesList.length > 0 ? (
                                                    <ul className="space-y-2 pt-1">
                                                        {themesList.slice(0, 3).map((t, idx) => (
                                                            <li key={idx} className="flex justify-between items-center text-xs pb-1.5 border-b border-secondary/10">
                                                                <span className="font-semibold text-text-dark/85 dark:text-text-light/90">{t.theme}</span>
                                                                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-secondary/10 text-primary dark:text-accent">
                                                                    {t.value}x
                                                                </span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-xs text-text-dark/50 dark:text-text-light/50 py-2">
                                                        No meaningful recurring themes detected yet.
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Coping activities */}
                                        <div className="bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between">
                                            <div className="space-y-3 text-left">
                                                <h4 className="text-xs font-extrabold uppercase tracking-wider text-text-dark/50 dark:text-text-light/50 flex items-center gap-1.5">
                                                    <FiCheckCircle className="text-emerald-500" />
                                                    Recommended Coping
                                                </h4>
                                                <ul className="space-y-2 pt-1 font-semibold text-xs text-text-dark/85 dark:text-text-light/90">
                                                    {aiInsightsData?.suggested_actions?.length > 0 ? (
                                                        aiInsightsData.suggested_actions.map((act, idx) => (
                                                            <li key={idx} className="flex items-center gap-2 pb-1.5 border-b border-secondary/10">
                                                                <FiZap className="text-emerald-500 flex-shrink-0" />
                                                                <span>{act}</span>
                                                            </li>
                                                        ))
                                                    ) : (
                                                        <>
                                                            <li className="flex items-center gap-2 pb-1.5 border-b border-secondary/10">
                                                                <FiZap className="text-emerald-500 flex-shrink-0" />
                                                                <span>Guided Breathing (5 min)</span>
                                                            </li>
                                                            <li className="flex items-center gap-2 pb-1.5 border-b border-secondary/10">
                                                                <FiZap className="text-indigo-500 flex-shrink-0" />
                                                                <span>Calming Meditation (10 min)</span>
                                                            </li>
                                                        </>
                                                    )}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Habits Info Analysis Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                                <div className="p-6 bg-emerald-500/10 border-2 border-emerald-500/15 dark:border-emerald-500/10 rounded-[2rem] text-left flex gap-4 items-start shadow-sm">
                                    <FiCheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-800 dark:text-emerald-300 block mb-1">
                                            Supporting Rhythm Habit
                                        </span>
                                        <p className="text-sm font-normal text-emerald-950 dark:text-emerald-200/90 leading-relaxed">
                                            {summaries.bestHabit}
                                        </p>
                                    </div>
                                </div>
                                <div className="p-6 bg-amber-500/10 border-2 border-amber-500/15 dark:border-amber-500/10 rounded-[2rem] text-left flex gap-4 items-start shadow-sm">
                                    <FiAlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <span className="text-xs uppercase font-extrabold tracking-wider text-amber-800 dark:text-amber-300 block mb-1">
                                            Focus Area
                                        </span>
                                        <p className="text-sm font-normal text-amber-950 dark:text-amber-200/90 leading-relaxed">
                                            {summaries.improvementNeed}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Panel 2: Progress Analytics Charts */}
                    {insightsTab === 'analytics' && (
                        <motion.div
                            key="analytics-panel"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2"
                        >
                            {/* Mood and Stress Trend Chart container */}
                            <div className="lg:col-span-8 bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between">
                                <div>
                                    <h4 className="text-sm font-extrabold uppercase tracking-wider text-text-dark/50 dark:text-text-light/50 flex items-center gap-1.5 mb-4">
                                        <FiTrendingUp className="text-secondary" />
                                        Weekly Mood vs Stress Ratio
                                    </h4>
                                </div>
                                <div className="h-72 w-full pt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorMoodTab" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#E67E22" stopOpacity={0.25} />
                                                    <stop offset="95%" stopColor="#E67E22" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorStressTab" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#BF5AF2" stopOpacity={0.25} />
                                                    <stop offset="95%" stopColor="#BF5AF2" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="name" stroke="currentColor" className="text-[10px] text-text-dark/40 dark:text-text-light/40" />
                                            <YAxis domain={[1, 10]} stroke="currentColor" className="text-[10px] text-text-dark/40 dark:text-text-light/40" />
                                            <Tooltip
                                                contentStyle={{
                                                    background: 'var(--tw-backdrop-blur, #ffffff)',
                                                    border: '1px solid rgba(139, 92, 246, 0.15)',
                                                    borderRadius: '16px',
                                                    fontSize: '12px'
                                                }}
                                            />
                                            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                                            <Area type="monotone" dataKey="Mood" stroke="#E67E22" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMoodTab)" name="Mood rating (1-5)" />
                                            <Area type="monotone" dataKey="Stress" stroke="#BF5AF2" strokeWidth={2.5} fillOpacity={1} fill="url(#colorStressTab)" name="Stress level (0-10)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Sleep vs Mood Correlation Chart */}
                            <div className="lg:col-span-4 bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between">
                                <div>
                                    <h4 className="text-sm font-extrabold uppercase tracking-wider text-text-dark/50 dark:text-text-light/50 flex items-center gap-1.5 mb-4">
                                        <FiMoon className="text-secondary" />
                                        Sleep vs Productivity
                                    </h4>
                                </div>
                                <div className="h-72 w-full pt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                            <XAxis dataKey="name" stroke="currentColor" className="text-[10px] opacity-50" />
                                            <Tooltip
                                                contentStyle={{
                                                    border: 'none',
                                                    borderRadius: '12px',
                                                    fontSize: '12px'
                                                }}
                                            />
                                            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                                            <Bar dataKey="Sleep" fill="#3AA853" radius={[4, 4, 0, 0]} name="Sleep (Hrs)" />
                                            <Bar dataKey="Productivity" fill="#FFC93C" radius={[4, 4, 0, 0]} name="Productivity score" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </PageTransition>
    );
};
