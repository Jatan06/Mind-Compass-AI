import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    FiSmile,
    FiActivity,
    FiZap,
    FiBookOpen,
    FiCompass,
    FiArrowRight,
    FiPlus,
    FiCheck,
    FiCalendar
} from 'react-icons/fi';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    Tooltip
} from 'recharts';
import { useApp } from '../context/AppContext';

const YesterdayRecCard = ({ data }) => {
    if (!data) {
        return (
            <div className="mt-2 p-4 rounded-2xl bg-secondary/10 dark:bg-secondary/5 border border-secondary/15 dark:border-secondary/5 flex flex-col gap-2 text-xs text-text-dark/50 dark:text-text-light/50">
                <span className="font-semibold text-center py-2">
                    No previous recommendation available.
                </span>
            </div>
        );
    }

    // Render stars helper
    const renderStars = (rating) => {
        if (!rating) return null;
        return (
            <div className="flex gap-0.5 text-amber-400 dark:text-amber-300">
                {Array.from({ length: 5 }).map((_, idx) => (
                    <span key={idx}>{idx < rating ? '★' : '☆'}</span>
                ))}
            </div>
        );
    };

    return (
        <div className="mt-2 p-4 rounded-2xl bg-secondary/15 dark:bg-secondary/5 border border-secondary/15 dark:border-secondary/5 flex flex-col gap-2 text-xs text-text-dark/85 dark:text-text-light/90">
            <div className="flex justify-between items-center">
                <span className="font-bold text-[10px] uppercase tracking-wider text-text-dark/45 dark:text-text-light/40">
                    {data.is_exactly_yesterday ? "Yesterday's Recommendation" : "Last Recommendation"}
                </span>
                <span className="text-[10px] text-text-dark/50 dark:text-text-light/50 font-medium">
                    {data.date}
                </span>
            </div>
            <div className="flex justify-between items-center gap-2 mt-1">
                <span className="font-bold text-sm text-text-dark dark:text-text-light flex items-center gap-1.5">
                    {data.completed ? (
                        <span className="text-emerald-500 font-bold">✔</span>
                    ) : (
                        <span className="text-text-dark/40">✖</span>
                    )}
                    {data.activity_name}
                </span>
                <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px]
                    ${data.completed
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-text-dark/10 opacity-70 text-text-dark dark:text-text-light'}
                `}>
                    {data.completed ? 'Completed' : 'Ignored'}
                </span>
            </div>
            {data.completed && (
                <div className="flex justify-between items-center gap-4 mt-0.5">
                    <span className="text-text-dark/70 dark:text-text-light/75">
                        {data.mood_improvement}
                    </span>
                    {renderStars(data.user_rating)}
                </div>
            )}
        </div>
    );
};

export const Dashboard = () => {
    const navigate = useNavigate();
    const {
        userProfile,
        checkins,
        journals,
        streak,
        wellnessScore,
        isOnboarded,
        refreshDashboardData,
        todayRecommendation,
        recLoading,
        predictionData,
        predictionLoading
    } = useApp();

    const recommendedActivity = todayRecommendation?.activity || null;
    const recReason = todayRecommendation?.reason || [];
    const recommendation = todayRecommendation;

    // Removed redundant refreshDashboardData() on mount to strictly avoid network duplication.
    // Dashboard data is globally hydrated by AppContext initially and post-mutations.

    // Use UTC date to match the Django backend (TIME_ZONE = 'UTC')
    const getUTCDateString = () => new Date().toISOString().split('T')[0];
    const todayStr = getUTCDateString();

    const todaysCheckin = checkins.find(c => c.date === todayStr);

    // Format mood data for Recharts (last 7 checkins)
    const moodHistory = checkins.slice(-7).map(c => {
        const shortDate = c.date.split('-').slice(1).join('/'); // MM/DD
        return {
            date: shortDate,
            mood: c.mood,
            stress: c.stress
        };
    });

    const mockStats = [
        {
            label: 'Wellness Score',
            val: wellnessScore !== null && wellnessScore !== undefined ? `${wellnessScore}/100` : '--',
            desc: 'Reflects mood, sleep & activity metrics',
            icon: <FiActivity className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />,
            color: 'from-indigo-500/10 to-blue-500/5',
        },
        {
            label: 'Daily Streak',
            val: `${streak} Days`,
            desc: 'Keep checking in daily to maintain',
            icon: <FiZap className="w-5 h-5 text-amber-500 dark:text-amber-400" />,
            color: 'from-amber-500/10 to-orange-500/5',
        },
        {
            label: 'Today’s Mood',
            val: todaysCheckin ? todaysCheckin.moodLabel : 'Not Checked In',
            desc: todaysCheckin ? 'Assessed this morning' : 'Complete check-in to see score',
            icon: <FiSmile className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />,
            color: 'from-emerald-500/10 to-teal-500/5',
        }
    ];


    // Adaptive mood prediction helper — returns a rich descriptor for the card
    const getPrediction = () => {
        if (!isOnboarded) {
            return { case: 'not_onboarded', status: 'neutral', logCount: 0 };
        }
        if (predictionLoading) {
            return { case: 'loading', status: 'neutral', logCount: 0 };
        }

        // Real log count from hydrated checkins array
        const logCount = checkins.length;

        if (!predictionData) {
            // No API data yet — distinguish 0 logs vs 1-6
            if (logCount === 0) return { case: 'zero_logs', status: 'neutral', logCount };
            if (logCount < 7) return { case: 'learning', status: 'neutral', logCount };
            return { case: 'loading', status: 'neutral', logCount };
        }

        // Stage 1 from API
        if (!predictionData.has_prediction) {
            if (logCount === 0) return { case: 'zero_logs', status: 'neutral', logCount };
            return { case: 'learning', status: 'neutral', logCount };
        }

        // Stage 2 or 3: real prediction
        const moodStatus = predictionData.predicted_mood >= 4 ? 'positive'
            : predictionData.predicted_mood <= 2 ? 'warning'
                : 'neutral';
        return {
            case: predictionData.stage === 3 ? 'personalized' : 'basic',
            status: moodStatus,
            logCount,
            ...predictionData
        };
    };


    const prediction = getPrediction();

    return (
        <div className="flex-grow flex flex-col gap-6 text-left">
            {/* Header Greeting Group */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-dark dark:text-text-light">
                        Hello, {userProfile.name.split(' ')[0]}
                    </h1>
                    <p className="text-sm md:text-base text-text-dark/65 dark:text-text-light/70 mt-1">
                        Here is a quick look at your wellness space today.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/app/checkin')}
                        className="inline-flex items-center gap-2 text-sm font-semibold bg-primary hover:bg-primary-hover dark:bg-accent dark:hover:bg-accent-hover text-bg-light dark:text-bg-dark px-4 py-2.5 rounded-full shadow-sm hover:shadow transition-all duration-200 cursor-pointer"
                    >
                        <FiPlus className="w-4 h-4" />
                        Log Today's Check-in
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {mockStats.map((stat, idx) => (
                    <motion.div
                        key={idx}
                        whileHover={{ y: -3 }}
                        className={`bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-3xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden`}
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-40 blur-2xl rounded-full" />
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-sm font-bold uppercase tracking-wider text-text-dark/60 dark:text-text-light/60">
                                {stat.label}
                            </span>
                            <div className="p-2 bg-secondary/10 dark:bg-secondary/5 rounded-xl">
                                {stat.icon}
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl md:text-3xl font-bold text-text-dark dark:text-text-light">
                                {stat.val}
                            </div>
                            <p className="text-xs text-text-dark/50 dark:text-text-light/50 mt-1.5 leading-relaxed">
                                {stat.desc}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Dashboard Rows */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Left Area: Graph & Recommendation */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    {/* Recharts Analytics Panel */}
                    <div className="bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-[2rem] p-6 md:p-8 flex flex-col justify-between shadow-sm relative">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-text-dark dark:text-text-light flex items-center gap-2">
                                    <FiActivity className="w-5 h-5 text-secondary" />
                                    Weekly Mood Trend
                                </h3>
                                <p className="text-xs text-text-dark/50 dark:text-text-light/50 mt-0.5">
                                    Overview of the last 7 logged days
                                </p>
                            </div>
                            <Link to="/app/insights" className="text-xs font-semibold text-secondary hover:text-primary dark:hover:text-accent flex items-center gap-1">
                                Full Analytics <FiArrowRight />
                            </Link>
                        </div>

                        {moodHistory.length > 0 ? (
                            <div className="h-64 w-full pt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={moodHistory} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#E67E22" stopOpacity={0.25} />
                                                <stop offset="95%" stopColor="#E67E22" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="date" stroke="currentColor" className="text-[10px] text-text-dark/40 dark:text-text-light/40" />
                                        <Tooltip
                                            contentStyle={{
                                                background: 'var(--tw-backdrop-blur, #ffffff)',
                                                border: '1px solid rgba(139, 92, 246, 0.15)',
                                                borderRadius: '16px',
                                                fontSize: '12px'
                                            }}
                                        />
                                        <Area type="monotone" dataKey="mood" stroke="#E67E22" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMood)" name="Mood (1-5)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-64 flex items-center justify-center border-2 border-dashed border-secondary/15 dark:border-secondary/5 rounded-2xl">
                                <span className="text-sm text-text-dark/50">Complete your first Check-in to build trend data.</span>
                            </div>
                        )}
                    </div>

                    {/* Mixed Emotional Signals Card — shown only when mood and journal conflict */}
                    {recommendation?.has_conflict && (
                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-400/30 dark:border-amber-500/20 rounded-[2rem] px-6 py-4 flex gap-4 items-start shadow-sm">
                            <div className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-amber-400/20 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 text-base font-bold">
                                ⚡
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
                                    Mixed Emotional Signals Detected
                                </p>
                                <p className="text-xs text-amber-700/85 dark:text-amber-400/80 leading-relaxed">
                                    {recommendation.conflict_reason ||
                                        "Your mood selection and journal express different emotional states. Today's recommendation is based primarily on your journal because written reflections usually provide more context."}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Highly Personalized Wellness Recommendation */}
                    <div className="bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-[2rem] p-6 md:p-8 flex flex-col justify-between shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 dark:bg-accent/5 rounded-full filter blur-2xl" />

                        {recLoading ? (
                            <div className="py-6 text-sm text-text-dark/50">Loading matches...</div>
                        ) : (
                            <>
                                <div className="flex justify-between items-start gap-4 mb-4">
                                    <span className="text-xs uppercase font-bold tracking-wider text-secondary">
                                        {recommendation?.status === 'complete' || recommendation?.status === 'wellness'
                                            ? 'Today’s Recommendation (Complete)'
                                            : recommendation?.status === 'quick'
                                                ? 'Today’s Recommendation (Quick)'
                                                : 'Today’s Recommendation (Locked)'}
                                    </span>
                                    <div className="px-3 py-1 bg-secondary/10 dark:bg-secondary/5 rounded-full text-xs font-semibold text-primary dark:text-accent">
                                        {recommendation?.status === 'complete' || recommendation?.status === 'wellness'
                                            ? 'Deep AI Match'
                                            : recommendation?.status === 'quick'
                                                ? 'Quick AI Match'
                                                : 'Locked'}
                                    </div>
                                </div>

                                {recommendation?.status === 'locked' && (
                                    <div className="flex flex-col gap-4">
                                        <p className="text-sm text-text-dark/70 dark:text-text-light/75 leading-relaxed">
                                            Log today's check-in to unlock your quick wellness recommendation.
                                        </p>
                                        <YesterdayRecCard data={recommendation?.yesterday_recommendation} />
                                    </div>
                                )}

                                {recommendation?.status === 'quick' && (
                                    <div className="flex flex-col gap-4">
                                        <h3 className="text-xl font-bold text-text-dark dark:text-text-light">
                                            {recommendedActivity?.title}
                                        </h3>
                                        <div>
                                            <span className="text-[10px] uppercase font-bold text-text-dark/45 dark:text-text-light/40 tracking-wider">
                                                Why this recommendation?
                                            </span>
                                            <ul className="list-disc pl-5 mt-1.5 space-y-1 text-xs text-text-dark/70 dark:text-text-light/75 leading-relaxed">
                                                {Array.isArray(recReason) ? (
                                                    recReason.map((r, i) => (
                                                        <li key={i}>{r}</li>
                                                    ))
                                                ) : (
                                                    <li>{recReason || recommendedActivity?.description}</li>
                                                )}
                                            </ul>
                                        </div>
                                        {recommendation?.daily_suggestion && (
                                            <div className="p-4 bg-indigo-500/10 border border-indigo-500/15 dark:bg-indigo-400/5 dark:border-indigo-400/10 rounded-2xl text-xs text-indigo-800 dark:text-indigo-300 flex flex-col gap-1 shadow-sm">
                                                <span className="font-bold text-[10px] uppercase tracking-wider text-indigo-500">💡 Personalized Suggestion</span>
                                                <p className="text-xs text-text-dark/85 dark:text-text-light/95 leading-relaxed">{recommendation.daily_suggestion}</p>
                                            </div>
                                        )}
                                        <div className="p-3 bg-amber-500/10 border border-amber-500/15 rounded-2xl text-[11px] text-amber-800 dark:text-amber-300">
                                            💡 <strong>Heads Up:</strong> Log today's journal entry to complete details and unlock deeper personalized recommendation parameters (Journal Theme Similarity, Emotion Analysis).
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold">
                                            <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                                Confidence: {recommendation?.confidence}%
                                            </span>
                                            <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                                Score: {recommendation?.recommendation_score}
                                            </span>
                                            <span className="text-text-dark/50 dark:text-text-light/50">
                                                Duration: {recommendedActivity?.duration}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-2">
                                            <button
                                                onClick={() => navigate(`/app/wellness`)}
                                                className="inline-flex items-center gap-1.5 text-sm font-semibold bg-primary hover:bg-primary-hover dark:bg-accent dark:hover:bg-accent-hover text-bg-light dark:text-bg-dark px-5 py-2.5 rounded-full transition-all cursor-pointer shadow-sm hover:shadow"
                                            >
                                                Start Activity
                                                <FiArrowRight />
                                            </button>
                                        </div>
                                        <YesterdayRecCard data={recommendation?.yesterday_recommendation} />
                                    </div>
                                )}

                                {(recommendation?.status === 'complete' || recommendation?.status === 'wellness') && (
                                    <div className="flex flex-col gap-4">
                                        <h3 className="text-xl font-bold text-text-dark dark:text-text-light">
                                            {recommendedActivity?.title}
                                        </h3>
                                        <div>
                                            <span className="text-[10px] uppercase font-bold text-text-dark/45 dark:text-text-light/40 tracking-wider">
                                                Why this recommendation?
                                            </span>
                                            <ul className="list-disc pl-5 mt-1.5 space-y-1 text-xs text-text-dark/70 dark:text-text-light/75 leading-relaxed">
                                                {Array.isArray(recReason) ? (
                                                    recReason.map((r, i) => (
                                                        <li key={i}>{r}</li>
                                                    ))
                                                ) : (
                                                    <li>{recReason || recommendedActivity?.description}</li>
                                                )}
                                            </ul>
                                        </div>
                                        {recommendation?.daily_suggestion && (
                                            <div className="p-4 bg-indigo-500/10 border border-indigo-500/15 dark:bg-indigo-400/5 dark:border-indigo-400/10 rounded-2xl text-xs text-indigo-800 dark:text-indigo-300 flex flex-col gap-1 shadow-sm">
                                                <span className="font-bold text-[10px] uppercase tracking-wider text-indigo-500">💡 Personalized Suggestion</span>
                                                <p className="text-xs text-text-dark/85 dark:text-text-light/95 leading-relaxed">{recommendation.daily_suggestion}</p>
                                            </div>
                                        )}
                                        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold">
                                            <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                                Confidence: {recommendation?.confidence}%
                                            </span>
                                            <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                                Score: {recommendation?.recommendation_score}
                                            </span>
                                            {recommendation?.historical_matches > 0 && (
                                                <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-lg">
                                                    {recommendation.historical_matches} {recommendation.historical_matches === 1 ? 'journal match' : 'journal matches'}
                                                </span>
                                            )}
                                            {recommendation?.previous_success_rate && (
                                                <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                                    {recommendation.previous_success_rate} Success Rate
                                                </span>
                                            )}
                                            <span className="text-text-dark/50 dark:text-text-light/50">
                                                Duration: {recommendedActivity?.duration}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-2">
                                            <button
                                                onClick={() => navigate(`/app/wellness`)}
                                                className="inline-flex items-center gap-1.5 text-sm font-semibold bg-primary hover:bg-primary-hover dark:bg-accent dark:hover:bg-accent-hover text-bg-light dark:text-bg-dark px-5 py-2.5 rounded-full transition-all cursor-pointer shadow-sm hover:shadow"
                                            >
                                                Start Activity
                                                <FiArrowRight />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Right Area: Prediction & Journal Preview */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* Predictive AI Box */}
                    <div className="bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-[2rem] p-6 md:p-8 flex flex-col shadow-sm relative">
                        <h3 className="text-lg font-bold text-text-dark dark:text-text-light flex items-center gap-2 mb-4">
                            <FiCompass className="w-5 h-5 text-indigo-500" />
                            Mood Prediction
                        </h3>

                        {/* Case 1: 0 logs */}
                        {(prediction.case === 'zero_logs' || prediction.case === 'not_onboarded') && (
                            <div className="p-4 rounded-2xl bg-secondary/10 text-text-dark/75 dark:text-text-light/80 border border-secondary/15 flex flex-col gap-2">
                                <p className="text-sm leading-relaxed">
                                    Complete your first mood check-in to begin building your emotional profile.
                                </p>
                                <span className="text-[10px] tracking-wider uppercase opacity-60 font-semibold mt-2">No history yet</span>
                            </div>
                        )}

                        {/* Case 2: 1–6 logs — learning phase */}
                        {prediction.case === 'learning' && (
                            <div className="p-4 rounded-2xl bg-indigo-500/8 dark:bg-indigo-500/5 border border-indigo-400/20 flex flex-col gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-1">Learning Your Emotional Patterns</p>
                                    <p className="text-xs text-text-dark/70 dark:text-text-light/75 leading-relaxed">
                                        We're learning how your mood changes over time. Continue checking in daily.
                                        Mood prediction becomes available after at least 7 days of history.
                                    </p>
                                </div>
                                {/* Progress bar */}
                                <div className="mt-1">
                                    <div className="flex justify-between items-center text-[11px] font-semibold text-text-dark/60 dark:text-text-light/50 mb-1.5">
                                        <span>Check-in Progress</span>
                                        <span>{prediction.logCount} of 7 completed</span>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-secondary/15 dark:bg-secondary/10 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-indigo-500 dark:bg-indigo-400 transition-all duration-500"
                                            style={{ width: `${Math.min(100, (prediction.logCount / 7) * 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-text-dark/40 dark:text-text-light/35 mt-1.5">Day {prediction.logCount} / 7</p>
                                </div>
                            </div>
                        )}

                        {/* Case 3 & 4: real prediction (Stage 2 basic / Stage 3 personalized) */}
                        {(prediction.case === 'basic' || prediction.case === 'personalized') && (
                            <div className={`p-4 rounded-2xl flex flex-col gap-3 ${prediction.status === 'warning'
                                ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/15'
                                : prediction.status === 'positive'
                                    ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/15'
                                    : 'bg-secondary/10 text-text-dark/75 dark:text-text-light/80 border border-secondary/15'
                                }`}>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-lg font-bold">{prediction.mood_label}</span>
                                    <span className="text-[11px] font-semibold opacity-70 px-2.5 py-1 rounded-full bg-white/20 dark:bg-black/15">
                                        {prediction.confidence != null ? `${Math.round(prediction.confidence * 100)}%` : ''}
                                        {prediction.confidence_label ? ` · ${prediction.confidence_label}` : ''}
                                    </span>
                                </div>
                                {prediction.why && (
                                    <p className="text-xs leading-relaxed opacity-90">{prediction.why}</p>
                                )}
                                {prediction.case === 'personalized' && prediction.risk_factors?.length > 0 && (
                                    <div className="text-[11px] leading-relaxed">
                                        <p className="font-semibold opacity-75 mb-1">Risk factors</p>
                                        <ul className="list-disc pl-4 space-y-0.5 opacity-80">
                                            {prediction.risk_factors.map((r, i) => <li key={i}>{r}</li>)}
                                        </ul>
                                    </div>
                                )}
                                {prediction.case === 'personalized' && prediction.protective_factors?.length > 0 && (
                                    <div className="text-[11px] leading-relaxed">
                                        <p className="font-semibold opacity-75 mb-1">Protective factors</p>
                                        <ul className="list-disc pl-4 space-y-0.5 opacity-80">
                                            {prediction.protective_factors.map((p, i) => <li key={i}>{p}</li>)}
                                        </ul>
                                    </div>
                                )}
                                <span className="text-[10px] tracking-wider uppercase opacity-60 font-semibold mt-1">Forecast for tomorrow</span>
                            </div>
                        )}

                        {prediction.case === 'loading' && (
                            <div className="p-4 rounded-2xl bg-secondary/10 border border-secondary/15 text-xs text-text-dark/50 dark:text-text-light/40">
                                Calculating mood prediction...
                            </div>
                        )}
                    </div>

                    {/* Recent Journal entry preview */}
                    <div className="bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-[2rem] p-6 md:p-8 flex flex-col justify-between shadow-sm relative flex-grow">
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-text-dark dark:text-text-light flex items-center gap-2">
                                    <FiBookOpen className="w-5 h-5 text-secondary" />
                                    Recent Journal
                                </h3>
                                <Link to="/app/journal" className="text-xs text-text-dark/50 dark:text-text-light/50 hover:underline">
                                    View All
                                </Link>
                            </div>

                            {journals.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-xs text-text-dark/50 dark:text-text-light/50">
                                        <FiCalendar />
                                        <span>{new Date(journals[0].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                        {journals[0].isVoice && <span className="bg-secondary/20 dark:bg-secondary/10 px-2 py-0.5 rounded-full text-[10px]">Voice</span>}
                                    </div>
                                    <p className="text-sm text-text-dark/75 dark:text-text-light/80 leading-relaxed line-clamp-3">
                                        "{journals[0].text}"
                                    </p>
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {(journals[0].analysis?.themes || []).map((theme, idx) => (
                                            <span key={idx} className="bg-secondary/10 dark:bg-secondary/5 text-primary dark:text-accent px-2.5 py-1 rounded-full text-[10px] font-semibold">
                                                {theme}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 text-center border-2 border-dashed border-secondary/15 dark:border-secondary/5 rounded-2xl flex flex-col items-center justify-center gap-3">
                                    <p className="text-xs text-text-dark/50">Describe your day to get personalized emotion analysis.</p>
                                    <Link to="/app/journal" className="text-xs font-semibold text-secondary hover:underline">Write Entry</Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
