/**
 * AppContext State Management Provider
 * 
 * What is it?
 * The core global React Context Provider (AppProvider) and custom hook (useApp) for MindCompass AI.
 * 
 * What does it do?
 * 1. Manages global session state (JWT access/refresh tokens, authentication loading, logged-in user profile).
 * 2. Hydrates user sessions automatically on page load or browser reload from localStorage/sessionStorage.
 * 3. Handles authentication workflows: Login, Register, Logout, and Google OAuth integration.
 * 4. Synchronizes dashboard data concurrently via `refreshDashboardData()` using `Promise.allSettled`
 *    (fetches User Profile, Mood Check-ins, Journals, Completed Activities, AI Recommendations, AI Predictions, AI Insights, and Analytics).
 * 5. Handles user onboarding assessments (`onboardUser`), assessment retakes (`retakeAssessment`), profile updates (`updateProfile`), and account deletion (`deleteAccount`).
 * 6. Provides CRUD API handlers for mood check-ins (`addCheckin`), text/voice journals (`addJournal`, `updateJournal`, `deleteJournal`), and activity feedback (`completeActivity`).
 * 7. Exposes `useApp()` custom hook for clean, error-safe context consumption across frontend views.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, assessmentAPI, profileAPI, moodAPI, journalAPI, activitiesAPI, recommendationAPI, insightsAPI, aiAPI } from '../services/api';

const AppContext = createContext(undefined);

export const AppProvider = ({ children }) => {
    // Session & Auth Tokens (loaded from storage if previously authenticated)
    const [token, setToken] = useState(() => localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || null);
    const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token') || null);
    const [authLoading, setAuthLoading] = useState(true);

    // User Profile state populated from Django User Profile model
    const [userProfile, setUserProfile] = useState({
        name: '',
        email: '',
        occupation: '',
        sleepHours: 7,
        exerciseFrequency: '',
        screenTime: 6,
        waterIntake: 2.5,
        goals: [],
        triggers: [],
        copingMethods: [],
        notifications: {
            dailyCheckin: true,
            weeklySummary: true,
            wellnessReminders: false
        },
        voicePreference: 'calm-female',
        theme: 'light',
        is_email_verified: false
    });

    // Onboarding status flag initialized from storage or defaults to false
    const [isOnboarded, setIsOnboarded] = useState(() => {
        try {
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                if (parsed.profile && typeof parsed.profile.is_onboarded === 'boolean') {
                    return parsed.profile.is_onboarded;
                }
            }
        } catch (e) { }
        return false;
    });

    // User metrics: Check-in streak count and calculated overall wellness score
    const [streak, setStreak] = useState(0);
    const [wellnessScore, setWellnessScore] = useState(null);

    // Active records: Mood check-ins log and journal entries
    const [checkins, setCheckins] = useState([]);
    const [journals, setJournals] = useState([]);

    // Activity records & favorites tracking
    const [completedActivities, setCompletedActivities] = useState([]);
    const [favorites, setFavorites] = useState(['act-1', 'act-5']);

    // Dashboard dynamic AI data states & loading indicators
    const [todayRecommendation, setTodayRecommendation] = useState(null);
    const [recLoading, setRecLoading] = useState(true);
    const [predictionData, setPredictionData] = useState(null);
    const [predictionLoading, setPredictionLoading] = useState(true);
    const [aiInsightsData, setAiInsightsData] = useState(null);
    const [insightsLoading, setInsightsLoading] = useState(true);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);

    /**
     * Fetches user profile metadata from the Django backend API.
     * Maps backend snake_case fields into frontend camelCase properties.
     */
    const fetchUserProfile = useCallback(async () => {
        try {
            // Use UTC date string to match backend UTC timezone requirement
            const getUTCDateString = () => new Date().toISOString().split('T')[0];
            const response = await profileAPI.get(getUTCDateString());
            const profileData = response.data;

            // Map backend fields to frontend state properties
            setUserProfile((prev) => ({
                ...prev,
                name: profileData.username || prev.name,
                email: profileData.email || prev.email,
                occupation: profileData.occupation || '',
                sleepHours: profileData.sleep_hours ? Number(profileData.sleep_hours) : 7,
                exerciseFrequency: profileData.exercise_frequency || '',
                screenTime: profileData.screen_time ? Number(profileData.screen_time) : 6,
                waterIntake: profileData.water_intake ? Number(profileData.water_intake) : 2.5,
                goals: profileData.goals || [],
                copingMethods: profileData.coping_methods || [],
                voicePreference: profileData.voice_preference || 'calm-female',
                theme: profileData.theme || 'light',
                is_email_verified: profileData.is_email_verified || false,
                triggers: profileData.notifications?.triggers || [],
                notifications: {
                    dailyCheckin: profileData.notifications?.dailyCheckin ?? true,
                    weeklySummary: profileData.notifications?.weeklySummary ?? true,
                    wellnessReminders: profileData.notifications?.wellnessReminders ?? false,
                },
            }));

            setIsOnboarded(profileData.is_onboarded || false);
            setStreak(profileData.streak || 0);
            setWellnessScore(profileData.wellness_score !== undefined && profileData.wellness_score !== null ? profileData.wellness_score : null);

            // Sync onboarding flag to stored currentUser object in localStorage
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
                try {
                    const parsed = JSON.parse(storedUser);
                    if (!parsed.profile) parsed.profile = {};
                    parsed.profile.is_onboarded = !!profileData.is_onboarded;
                    localStorage.setItem('currentUser', JSON.stringify(parsed));
                } catch (e) { }
            }
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
        }
    }, []);

    /**
     * Concurrently re-fetches all dashboard data from backend APIs using Promise.allSettled.
     * Updates check-ins, journals, activities, AI recommendations, AI predictions, insights, and analytics.
     */
    const refreshDashboardData = useCallback(async () => {
        if (!token) {
            return { checkins: [] };
        }

        try {
            setRecLoading(true);
            setPredictionLoading(true);
            setInsightsLoading(true);
            setAnalyticsLoading(true);

            // Execute independent API requests concurrently for optimal loading performance
            const [
                profileRes,
                moodRes,
                journalRes,
                activityRes,
                recRes,
                predRes,
                insightsRes,
                analyticsRes
            ] = await Promise.allSettled([
                fetchUserProfile(),
                moodAPI.getHistory(),
                journalAPI.getAll(),
                activitiesAPI.getFeedback(),
                recommendationAPI.getToday(),
                aiAPI.getPrediction(),
                aiAPI.getInsights(),
                insightsAPI.getAnalytics()
            ]);

            // 1. Mood Check-ins Processing
            let mappedCheckins = [];
            if (moodRes.status === 'fulfilled' && moodRes.value?.status === 200 && Array.isArray(moodRes.value.data)) {
                mappedCheckins = moodRes.value.data.map(c => ({
                    ...c,
                    sleep: c.sleep ? parseFloat(c.sleep) : 0,
                    moodLabel: c.mood_label || ''
                })).reverse();
                setCheckins(mappedCheckins);
            }

            // 2. Journals Processing
            if (journalRes.status === 'fulfilled' && journalRes.value?.status === 200 && Array.isArray(journalRes.value.data)) {
                const mappedJournals = journalRes.value.data.map(j => ({
                    ...j,
                    isVoice: j.is_voice
                }));
                setJournals(mappedJournals);
            }

            // 3. Completed Activities Processing
            if (activityRes.status === 'fulfilled' && activityRes.value?.status === 200 && Array.isArray(activityRes.value.data)) {
                const mappedFeedback = activityRes.value.data.map(f => ({
                    id: f.id,
                    activityId: f.activity,
                    date: f.date,
                    durationMinutes: f.duration_minutes,
                    satisfaction: f.satisfaction,
                    moodImproved: f.mood_improved
                }));
                setCompletedActivities(mappedFeedback);
            }

            // 4. Recommendation Processing
            if (recRes.status === 'fulfilled' && recRes.value?.status === 200 && recRes.value.data) {
                setTodayRecommendation(recRes.value.data);
            } else {
                setTodayRecommendation(null);
            }

            // 5. AI Prediction Processing
            if (predRes.status === 'fulfilled' && predRes.value?.status === 200 && predRes.value.data) {
                setPredictionData(predRes.value.data);
            } else {
                setPredictionData(null);
            }

            // 6. AI Insights Processing
            if (insightsRes.status === 'fulfilled' && insightsRes.value?.status === 200 && insightsRes.value.data) {
                setAiInsightsData(insightsRes.value.data);
            } else {
                setAiInsightsData(null);
            }

            // 7. Analytics Metrics Processing
            if (analyticsRes.status === 'fulfilled' && analyticsRes.value?.status === 200 && analyticsRes.value.data) {
                setAnalyticsData(analyticsRes.value.data);
            } else {
                setAnalyticsData(null);
            }
            return { checkins: mappedCheckins };
        } catch (error) {
            console.error('Failed to refresh dashboard data:', error);
            return { checkins: [] };
        } finally {
            setRecLoading(false);
            setPredictionLoading(false);
            setInsightsLoading(false);
            setAnalyticsLoading(false);
        }
    }, [fetchUserProfile]);

    const [isInitialLoading, setIsInitialLoading] = useState(true);

    // Effect: Session Hydration on initial application mount
    useEffect(() => {
        const hydrateSession = async () => {
            try {
                const storedAccess = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
                const storedRefresh = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');

                if (storedAccess && storedRefresh) {
                    setToken(storedAccess);
                    setRefreshToken(storedRefresh);

                    // Hydrate cached user info from storage first for immediate rendering
                    const storedUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
                    if (storedUser) {
                        try {
                            const parsed = JSON.parse(storedUser);
                            setUserProfile((prev) => ({
                                ...prev,
                                name: parsed.username || '',
                                email: parsed.email || '',
                            }));
                            if (parsed.profile && typeof parsed.profile.is_onboarded === 'boolean') {
                                setIsOnboarded(parsed.profile.is_onboarded);
                            }
                        } catch (e) {
                            // Invalid stored format
                        }
                    }

                    // Await full backend refresh to populate active context state
                    try {
                        await refreshDashboardData();
                    } catch (err) {
                        console.error("Error refreshing dashboard during hydration:", err);
                    }
                }
            } catch (error) {
                console.error("Hydration error:", error);
            } finally {
                setAuthLoading(false);
                setIsInitialLoading(false);
            }
        };
        hydrateSession();
    }, [refreshDashboardData]);

    // Clears all stored tokens and resets context state on logout or session expiration
    const clearAuthData = useCallback(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('remembered_username');
        localStorage.removeItem('ai_chat_messages');
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('ai_chat_messages');
        sessionStorage.removeItem('has_checked_daily_checkin_redirect');
        setToken(null);
        setRefreshToken(null);
        setIsOnboarded(false);
        setUserProfile({
            name: '',
            email: '',
            occupation: '',
            sleepHours: 7,
            exerciseFrequency: '',
            screenTime: 6,
            waterIntake: 2.5,
            goals: [],
            triggers: [],
            copingMethods: [],
            notifications: { dailyCheckin: true, weeklySummary: true, wellnessReminders: false },
            voicePreference: 'calm-female',
            theme: 'light',
            is_email_verified: false
        });
        setCheckins([]);
        setJournals([]);
    }, []);

    // Effect: Listen for session expiration events broadcasted by Axios interceptors
    useEffect(() => {
        window.addEventListener('auth_session_expired', clearAuthData);
        return () => {
            window.removeEventListener('auth_session_expired', clearAuthData);
        };
    }, [clearAuthData]);

    /**
     * Authenticates user credentials via Django API and initializes active session.
     */
    const login = async (emailOrUsername, password, rememberMe = false) => {
        const response = await authAPI.login({
            email: emailOrUsername,
            password,
        });

        if (response.data.success) {
            const { access, refresh } = response.data.tokens;
            const userObj = response.data.user;

            const storage = rememberMe ? localStorage : sessionStorage;
            const altStorage = rememberMe ? sessionStorage : localStorage;

            altStorage.removeItem('access_token');
            altStorage.removeItem('refresh_token');
            altStorage.removeItem('currentUser');

            storage.setItem('access_token', access);
            storage.setItem('refresh_token', refresh);
            storage.setItem('currentUser', JSON.stringify(userObj));

            setToken(access);
            setRefreshToken(refresh);
            if (userObj && userObj.profile) {
                setIsOnboarded(userObj.profile.is_onboarded || false);
            }
            setUserProfile((prev) => ({
                ...prev,
                name: userObj.username,
                email: userObj.email,
            }));

            // Sync dashboard records after login
            const dashData = await refreshDashboardData();
            response.data.dashboardData = dashData;
        }
        return response.data;
    };

    /**
     * Registers a new user account on the backend.
     */
    const register = async (username, email, password, password_confirm) => {
        const response = await authAPI.register({
            username,
            email,
            password,
            password_confirm,
        });
        return response.data;
    };

    /**
     * Logs out the user session, revoking refresh tokens on backend and clearing local state.
     */
    const logout = async () => {
        try {
            if (refreshToken) {
                await authAPI.logout(refreshToken);
            }
        } catch (e) {
            console.error('Logout API dispatch error:', e);
        } finally {
            clearAuthData();
        }
    };

    /**
     * Handles Google OAuth authentication and session creation.
     */
    const googleLogin = async (googleToken, email = null, name = null, rememberMe = true) => {
        const response = await authAPI.googleLogin({
            token: googleToken,
            email,
            name,
        });

        if (response.data.success) {
            const { access, refresh } = response.data.tokens;
            const userObj = response.data.user;

            const storage = rememberMe ? localStorage : sessionStorage;
            const altStorage = rememberMe ? sessionStorage : localStorage;

            altStorage.removeItem('access_token');
            altStorage.removeItem('refresh_token');
            altStorage.removeItem('currentUser');

            storage.setItem('access_token', access);
            storage.setItem('refresh_token', refresh);
            storage.setItem('currentUser', JSON.stringify(userObj));

            setToken(access);
            setRefreshToken(refresh);
            if (userObj && userObj.profile) {
                setIsOnboarded(userObj.profile.is_onboarded || false);
            }
            setUserProfile((prev) => ({
                ...prev,
                name: userObj.username,
                email: userObj.email,
            }));

            const dashData = await refreshDashboardData();
            response.data.dashboardData = dashData;
        }
        return response.data;
    };

    /**
     * Saves user onboarding questionnaire answers to backend assessment API.
     */
    const onboardUser = async (onboardingData) => {
        const rawPayload = {
            demographic: {
                occupation: onboardingData.occupation,
            },
            baseline: {
                sleep: onboardingData.sleepHours,
                exercise: onboardingData.exerciseFrequency,
                screenTime: onboardingData.screenTime,
                water: onboardingData.waterIntake,
            },
            goals: onboardingData.goals,
            copingMethods: onboardingData.copingMethods,
            emotionalWellbeing: onboardingData.emotionalWellbeing,
            stressContributors: onboardingData.stressContributors,
        };

        let response;
        try {
            response = await assessmentAPI.save(rawPayload);
        } catch (error) {
            // Fallback to update PUT if assessment already exists
            response = await assessmentAPI.update(rawPayload);
        }

        setUserProfile((prev) => ({
            ...prev,
            goals: onboardingData.goals || prev.goals,
            copingMethods: onboardingData.copingMethods || prev.copingMethods,
            occupation: onboardingData.occupation || prev.occupation,
            sleepHours: onboardingData.sleepHours || prev.sleepHours,
            exerciseFrequency: onboardingData.exerciseFrequency || prev.exerciseFrequency,
            screenTime: onboardingData.screenTime || prev.screenTime,
            waterIntake: onboardingData.waterIntake || prev.waterIntake,
        }));
        setIsOnboarded(true);

        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                if (!parsed.profile) parsed.profile = {};
                parsed.profile.is_onboarded = true;
                localStorage.setItem('currentUser', JSON.stringify(parsed));
            } catch (e) { }
        }
        await refreshDashboardData();

        return response.data;
    };

    /**
     * Triggers assessment retake workflow to update baseline profile parameters.
     */
    const retakeAssessment = async () => {
        const response = await assessmentAPI.retake();
        setIsOnboarded(false);
        await refreshDashboardData();
        return response.data;
    };

    /**
     * Deletes user account and purges local storage.
     */
    const deleteAccount = async () => {
        await profileAPI.deleteAccount();
        localStorage.clear();
        sessionStorage.clear();
        setToken(null);
        setRefreshToken(null);
    };

    /**
     * Updates user profile details and settings via backend PUT request.
     */
    const updateProfile = async (updatedProfile) => {
        const payload = {
            username: updatedProfile.name !== undefined ? updatedProfile.name : userProfile.name,
            email: updatedProfile.email !== undefined ? updatedProfile.email : userProfile.email,
            occupation: updatedProfile.occupation !== undefined ? updatedProfile.occupation : userProfile.occupation,
            sleep_hours: updatedProfile.sleepHours !== undefined ? updatedProfile.sleepHours : userProfile.sleepHours,
            exercise_frequency: updatedProfile.exerciseFrequency !== undefined ? updatedProfile.exerciseFrequency : userProfile.exerciseFrequency,
            screen_time: updatedProfile.screenTime !== undefined ? updatedProfile.screenTime : userProfile.screenTime,
            water_intake: updatedProfile.waterIntake !== undefined ? updatedProfile.waterIntake : userProfile.waterIntake,
            goals: updatedProfile.goals !== undefined ? updatedProfile.goals : userProfile.goals,
            coping_methods: updatedProfile.copingMethods !== undefined ? updatedProfile.copingMethods : userProfile.copingMethods,
            notifications: {
                ...(updatedProfile.notifications !== undefined ? updatedProfile.notifications : userProfile.notifications),
                triggers: updatedProfile.triggers !== undefined ? updatedProfile.triggers : userProfile.triggers,
            },
        };

        const response = await profileAPI.update(payload);
        const profileData = response.data;

        setUserProfile((prev) => ({
            ...prev,
            name: profileData.username || prev.name,
            email: profileData.email || prev.email,
            occupation: profileData.occupation || '',
            sleepHours: profileData.sleep_hours ? Number(profileData.sleep_hours) : 7,
            exerciseFrequency: profileData.exercise_frequency || '',
            screenTime: profileData.screen_time ? Number(profileData.screen_time) : 6,
            waterIntake: profileData.water_intake ? Number(profileData.water_intake) : 2.5,
            goals: profileData.goals || [],
            copingMethods: profileData.coping_methods || [],
            theme: profileData.theme || 'light',
            triggers: profileData.notifications?.triggers || [],
            notifications: {
                dailyCheckin: profileData.notifications?.dailyCheckin ?? true,
                weeklySummary: profileData.notifications?.weeklySummary ?? true,
                wellnessReminders: profileData.notifications?.wellnessReminders ?? false,
            },
        }));

        const storedUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                parsed.username = profileData.username || parsed.username;
                parsed.email = profileData.email || parsed.email;
                const storage = localStorage.getItem('currentUser') ? localStorage : sessionStorage;
                storage.setItem('currentUser', JSON.stringify(parsed));
            } catch (e) { }
        }

        return response.data;
    };

    /**
     * Submits a daily mood check-in entry to the backend.
     */
    const addCheckin = async (checkinData) => {
        const payload = {
            date: checkinData.date,
            mood: checkinData.mood,
            mood_label: checkinData.moodLabel,
            stress: checkinData.stress,
            energy: checkinData.energy,
            sleep: checkinData.sleep,
            productivity: checkinData.productivity,
            social: checkinData.social,
            notes: checkinData.notes
        };

        if (!payload.date) {
            delete payload.date;
        }

        const response = await moodAPI.submit(payload);
        await refreshDashboardData();
        return response.data;
    };

    /**
     * Creates a new text or voice journal entry and receives AI sentiment analysis.
     */
    const addJournal = async (text, isVoice = false) => {
        const response = await journalAPI.create({
            text,
            is_voice: isVoice
        });
        await refreshDashboardData();
        return response.data.analysis;
    };

    /**
     * Updates text of an existing journal entry.
     */
    const updateJournal = async (id, text) => {
        const response = await journalAPI.update(id, { text });
        await refreshDashboardData();
        return response.data;
    };

    /**
     * Deletes a journal entry by ID.
     */
    const deleteJournal = async (id) => {
        const response = await journalAPI.delete(id);
        await refreshDashboardData();
        return response.data;
    };

    /**
     * Submits completion feedback for a wellness activity.
     */
    const completeActivity = async (activityId, durationMinutes, feedback) => {
        try {
            await activitiesAPI.submitFeedback({
                activity_id: activityId,
                duration_minutes: durationMinutes,
                satisfaction: feedback.satisfaction,
                mood_improved: feedback.moodImproved,
            });
            await refreshDashboardData();
        } catch (error) {
            console.error('Failed to complete activity:', error);
            throw error;
        }
    };

    /**
     * Toggles an activity ID in the favorites list.
     */
    const toggleFavorite = (activityId) => {
        setFavorites((prev) =>
            prev.includes(activityId)
                ? prev.filter((id) => id !== activityId)
                : [...prev, activityId]
        );
    };

    return (
        <AppContext.Provider
            value={{
                token,
                authLoading,
                isInitialLoading,
                isAuthenticated: !!token,
                userProfile,
                isOnboarded,
                setIsOnboarded,
                streak,
                wellnessScore,
                checkins,
                journals,
                completedActivities,
                favorites,
                login,
                register,
                logout,
                googleLogin,
                onboardUser,
                retakeAssessment,
                deleteAccount,
                updateProfile,
                addCheckin,
                addJournal,
                updateJournal,
                deleteJournal,
                completeActivity,
                toggleFavorite,
                refreshDashboardData,
                todayRecommendation,
                recLoading,
                predictionData,
                predictionLoading,
                aiInsightsData,
                insightsLoading,
                analyticsData,
                analyticsLoading,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

/**
 * Custom hook to safely consume AppContext.
 * Throws an explicit error if invoked outside of an AppProvider context tree.
 */
export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};

