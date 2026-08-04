import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, assessmentAPI, profileAPI, moodAPI, journalAPI, activitiesAPI, recommendationAPI, insightsAPI, aiAPI } from '../services/api';

const AppContext = createContext(undefined);

export const AppProvider = ({ children }) => {
    // Session State
    const [token, setToken] = useState(() => localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || null);
    const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token') || null);
    const [authLoading, setAuthLoading] = useState(true);

    // User Profile settings loaded from Django User profile object
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
    const [streak, setStreak] = useState(0);
    const [wellnessScore, setWellnessScore] = useState(null);

    // Active state from DB
    const [checkins, setCheckins] = useState([]);
    const [journals, setJournals] = useState([]);

    const [completedActivities, setCompletedActivities] = useState([]);

    const [favorites, setFavorites] = useState(['act-1', 'act-5']);
    const [todayRecommendation, setTodayRecommendation] = useState(null);
    const [recLoading, setRecLoading] = useState(true);
    const [predictionData, setPredictionData] = useState(null);
    const [predictionLoading, setPredictionLoading] = useState(true);
    const [aiInsightsData, setAiInsightsData] = useState(null);
    const [insightsLoading, setInsightsLoading] = useState(true);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);

    // Fetch user profile from Django backend
    const fetchUserProfile = useCallback(async () => {
        try {
            // Use UTC date to match the Django backend (TIME_ZONE = 'UTC')
            const getUTCDateString = () => new Date().toISOString().split('T')[0];
            const response = await profileAPI.get(getUTCDateString());
            const profileData = response.data;

            // Map backend fields to frontend camelCase formats
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
                // Load triggers from serializations inside notifications object keys
                triggers: profileData.notifications?.triggers || [],
                notifications: {
                    dailyCheckin: profileData.notifications?.dailyCheckin ?? true,
                    weeklySummary: profileData.notifications?.weeklySummary ?? true,
                    wellnessReminders: profileData.notifications?.wellnessReminders ?? false,
                },
            }));

            setIsOnboarded(profileData.is_onboarded || false);
            setStreak(profileData.streak || 0);
            setWellnessScore(profileData.wellness_score || 72);

            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
                try {
                    const parsed = JSON.parse(storedUser);
                    if (!parsed.profile) parsed.profile = {};
                    parsed.profile.is_onboarded = !!profileData.is_onboarded;
                    localStorage.setItem('currentUser', JSON.stringify(parsed));
                } catch (e) { }
            }
            setWellnessScore(profileData.wellness_score !== undefined && profileData.wellness_score !== null ? profileData.wellness_score : null);
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
        }
    }, []);

    // Refresh all central dashboard and histories variables from backend APIs concurrently
    const refreshDashboardData = useCallback(async () => {
        try {
            setRecLoading(true);
            setPredictionLoading(true);
            setInsightsLoading(true);
            setAnalyticsLoading(true);

            // Execute independent API calls concurrently for massive performance speedup
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

            // 1. Mood Checkins
            if (moodRes.status === 'fulfilled' && moodRes.value?.status === 200 && Array.isArray(moodRes.value.data)) {
                const mappedCheckins = moodRes.value.data.map(c => ({
                    ...c,
                    sleep: c.sleep ? parseFloat(c.sleep) : 0,
                    moodLabel: c.mood_label || ''
                }));
                setCheckins(mappedCheckins.reverse());
            }

            // 2. Journals
            if (journalRes.status === 'fulfilled' && journalRes.value?.status === 200 && Array.isArray(journalRes.value.data)) {
                const mappedJournals = journalRes.value.data.map(j => ({
                    ...j,
                    isVoice: j.is_voice
                }));
                setJournals(mappedJournals);
            }

            // 3. Completed Activities
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

            // 4. Recommendation
            if (recRes.status === 'fulfilled' && recRes.value?.status === 200 && recRes.value.data) {
                setTodayRecommendation(recRes.value.data);
            } else {
                setTodayRecommendation(null);
            }

            // 5. AI Prediction
            if (predRes.status === 'fulfilled' && predRes.value?.status === 200 && predRes.value.data) {
                setPredictionData(predRes.value.data);
            } else {
                setPredictionData(null);
            }

            // 6. AI Insights
            if (insightsRes.status === 'fulfilled' && insightsRes.value?.status === 200 && insightsRes.value.data) {
                setAiInsightsData(insightsRes.value.data);
            } else {
                setAiInsightsData(null);
            }

            // 7. Analytics
            if (analyticsRes.status === 'fulfilled' && analyticsRes.value?.status === 200 && analyticsRes.value.data) {
                setAnalyticsData(analyticsRes.value.data);
            } else {
                setAnalyticsData(null);
            }
        } catch (error) {
            console.error('Failed to refresh dashboard data:', error);
        } finally {
            setRecLoading(false);
            setPredictionLoading(false);
            setInsightsLoading(false);
            setAnalyticsLoading(false);
        }
    }, [fetchUserProfile]);

    const [isInitialLoading, setIsInitialLoading] = useState(true);

    // Session Hydration on page reload
    useEffect(() => {
        const hydrateSession = async () => {
            try {
                const storedAccess = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
                const storedRefresh = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');

                if (storedAccess && storedRefresh) {
                    setToken(storedAccess);
                    setRefreshToken(storedRefresh);
                    // Also hydrate raw user config first
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
                            // invalid details
                        }
                    }
                    // Fetch all backend data and await completion before releasing loading state
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

    // Handle token session expiry broadcast events
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

    useEffect(() => {
        window.addEventListener('auth_session_expired', clearAuthData);
        return () => {
            window.removeEventListener('auth_session_expired', clearAuthData);
        };
    }, [clearAuthData]);

    // Context Auth Workflows
    const login = async (emailOrUsername, password, rememberMe = false) => {
        const response = await authAPI.login({
            email: emailOrUsername, // django holds compatibility logic for backend authentication Service
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

            // Sync full details
            await refreshDashboardData();
        }
        return response.data;
    };

    const register = async (username, email, password, password_confirm) => {
        const response = await authAPI.register({
            username,
            email,
            password,
            password_confirm,
        });
        return response.data;
    };

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

            await refreshDashboardData();
        }
        return response.data;
    };

    const onboardUser = async (onboardingData) => {
        // Build assessment payload matching Django backend expectation
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

        // Save assessment payload directly to Django backend
        let response;
        try {
            response = await assessmentAPI.save(rawPayload);
        } catch (error) {
            // Fallback to update PUT if assessment already exists
            response = await assessmentAPI.update(rawPayload);
        }

        // Apply fields locally
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

    const retakeAssessment = async () => {
        const response = await assessmentAPI.retake();
        setIsOnboarded(false);
        await refreshDashboardData();
        return response.data;
    };

    const deleteAccount = async () => {
        await profileAPI.deleteAccount();
        // Clear all local storage and session storage
        localStorage.clear();
        sessionStorage.clear();
        setToken(null);
        setRefreshToken(null);
    };

    const updateProfile = async (updatedProfile) => {
        // Prepare PUT payload matching back-end serializers
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
            // Bundle triggers inside notifications object to persist in backend database
            notifications: {
                ...(updatedProfile.notifications !== undefined ? updatedProfile.notifications : userProfile.notifications),
                triggers: updatedProfile.triggers !== undefined ? updatedProfile.triggers : userProfile.triggers,
            },
        };

        const response = await profileAPI.update(payload);
        const profileData = response.data;

        // Sync new data keys
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

        // Update stored currentUser in storage so sidebar initials/details sync
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

    // Dashboard checkin and journals API calls
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

    const addJournal = async (text, isVoice = false) => {
        const response = await journalAPI.create({
            text,
            is_voice: isVoice
        });
        await refreshDashboardData();
        return response.data.analysis;
    };

    const updateJournal = async (id, text) => {
        const response = await journalAPI.update(id, { text });
        await refreshDashboardData();
        return response.data;
    };

    const deleteJournal = async (id) => {
        const response = await journalAPI.delete(id);
        await refreshDashboardData();
        return response.data;
    };

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

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
