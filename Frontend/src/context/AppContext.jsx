import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, assessmentAPI, profileAPI, moodAPI, journalAPI, activitiesAPI, recommendationAPI, insightsAPI, aiAPI } from '../services/api';

const AppContext = createContext(undefined);

export const AppProvider = ({ children }) => {
    // Session State
    const [token, setToken] = useState(() => localStorage.getItem('access_token') || null);
    const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refresh_token') || null);
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

    const [isOnboarded, setIsOnboarded] = useState(false);
    const [streak, setStreak] = useState(0);
    const [wellnessScore, setWellnessScore] = useState(72);

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
            const getLocalDateString = (d = new Date()) => {
                const offset = d.getTimezoneOffset();
                const localDate = new Date(d.getTime() - (offset * 60 * 1000));
                return localDate.toISOString().split('T')[0];
            };
            const response = await profileAPI.get(getLocalDateString());
            const profileData = response.data;

            // Map backend fields to frontend camelCase formats
            setUserProfile((prev) => ({
                ...prev,
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
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
        }
    }, []);

    // Refresh all central dashboard and histories variables from backend APIs
    const refreshDashboardData = useCallback(async () => {
        try {
            // 1. Fetch latest profile stats (wellnessScore, streak)
            await fetchUserProfile();

            // 2. Fetch mood checkins history
            const moodRes = await moodAPI.getHistory();
            if (moodRes.status === 200 && Array.isArray(moodRes.data)) {
                const mappedCheckins = moodRes.data.map(c => ({
                    ...c,
                    sleep: c.sleep ? parseFloat(c.sleep) : 0,
                    moodLabel: c.mood_label || '' // map snake_case to camelCase
                }));
                // Sort checkins chronologically so charts map time correctly
                setCheckins(mappedCheckins.reverse());
            }

            // 3. Fetch journals history
            const journalRes = await journalAPI.getAll();
            if (journalRes.status === 200 && Array.isArray(journalRes.data)) {
                const mappedJournals = journalRes.data.map(j => ({
                    ...j,
                    isVoice: j.is_voice // map snake_case to camelCase
                }));
                setJournals(mappedJournals);
            }
            // 4. Fetch activity feedbacks
            try {
                const activityFeedbacksRes = await activitiesAPI.getFeedback();
                if (activityFeedbacksRes.status === 200 && Array.isArray(activityFeedbacksRes.data)) {
                    const mappedFeedback = activityFeedbacksRes.data.map(f => ({
                        id: f.id,
                        activityId: f.activity,
                        date: f.date,
                        durationMinutes: f.duration_minutes,
                        satisfaction: f.satisfaction,
                        moodImproved: f.mood_improved
                    }));
                    setCompletedActivities(mappedFeedback);
                }
            } catch (err) {
                console.error("Failed to load activity completion history:", err);
            }

            // 5. Fetch today's recommendation
            try {
                setRecLoading(true);
                const recRes = await recommendationAPI.getToday();
                if (recRes.status === 200 && recRes.data) {
                    setTodayRecommendation(recRes.data);
                } else {
                    setTodayRecommendation(null);
                }
            } catch (err) {
                console.error("Failed to load today's recommendation:", err);
                setTodayRecommendation(null);
            } finally {
                setRecLoading(false);
            }

            // 6. Fetch today's prediction
            try {
                setPredictionLoading(true);
                const predRes = await aiAPI.getPrediction();
                if (predRes.status === 200 && predRes.data) {
                    setPredictionData(predRes.data);
                } else {
                    setPredictionData(null);
                }
            } catch (err) {
                console.error("Failed to load today's prediction:", err);
                setPredictionData(null);
            } finally {
                setPredictionLoading(false);
            }

            // 7. Fetch today's AI insights
            try {
                setInsightsLoading(true);
                const insightsRes = await aiAPI.getInsights();
                if (insightsRes.status === 200 && insightsRes.data) {
                    setAiInsightsData(insightsRes.data);
                } else {
                    setAiInsightsData(null);
                }
            } catch (err) {
                console.error("Failed to load today's AI insights:", err);
                setAiInsightsData(null);
            } finally {
                setInsightsLoading(false);
            }

            // 8. Fetch analytics data
            try {
                setAnalyticsLoading(true);
                const analyticsRes = await insightsAPI.getAnalytics();
                if (analyticsRes.status === 200 && analyticsRes.data) {
                    setAnalyticsData(analyticsRes.data);
                } else {
                    setAnalyticsData(null);
                }
            } catch (err) {
                console.error("Failed to load analytics data:", err);
                setAnalyticsData(null);
            } finally {
                setAnalyticsLoading(false);
            }
        } catch (error) {
            console.error('Failed to refresh dashboard data:', error);
        }
    }, [fetchUserProfile]);

    // Session Hydration on page reload
    useEffect(() => {
        const hydrateSession = async () => {
            const storedAccess = localStorage.getItem('access_token');
            const storedRefresh = localStorage.getItem('refresh_token');

            if (storedAccess && storedRefresh) {
                setToken(storedAccess);
                setRefreshToken(storedRefresh);
                // Also hydrate raw user config first
                const storedUser = localStorage.getItem('currentUser');
                if (storedUser) {
                    try {
                        const parsed = JSON.parse(storedUser);
                        setUserProfile((prev) => ({
                            ...prev,
                            name: parsed.username,
                            email: parsed.email,
                        }));
                    } catch (e) {
                        // invalid details
                    }
                }
                await refreshDashboardData();
            }
            setAuthLoading(false);
        };
        hydrateSession();
    }, [refreshDashboardData]);

    // Handle token session expiry broadcast events
    const clearAuthData = useCallback(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('currentUser');
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
    const login = async (emailOrUsername, password) => {
        const response = await authAPI.login({
            email: emailOrUsername, // django holds compatibility logic for backend authentication Service
            password,
        });

        if (response.data.success) {
            const { access, refresh } = response.data.tokens;
            const userObj = response.data.user;

            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);
            localStorage.setItem('currentUser', JSON.stringify(userObj));

            setToken(access);
            setRefreshToken(refresh);
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

    const googleLogin = async (googleToken, email = null, name = null) => {
        const response = await authAPI.googleLogin({
            token: googleToken,
            email,
            name,
        });

        if (response.data.success) {
            const { access, refresh } = response.data.tokens;
            const userObj = response.data.user;

            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);
            localStorage.setItem('currentUser', JSON.stringify(userObj));

            setToken(access);
            setRefreshToken(refresh);
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

        // Try load latest assessment structure first to determine PUT or POST
        let response;
        try {
            // Check if assessment is already logged in DB
            await assessmentAPI.getLatest();
            // Exist, run update PUT
            response = await assessmentAPI.update(rawPayload);
        } catch (error) {
            // Not found, run save POST
            response = await assessmentAPI.save(rawPayload);
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
        await refreshDashboardData();

        return response.data;
    };

    const retakeAssessment = async () => {
        const response = await assessmentAPI.retake();
        setIsOnboarded(false);
        await refreshDashboardData();
        return response.data;
    };

    const updateProfile = async (updatedProfile) => {
        // Prepare PUT payload matching back-end serializers
        const payload = {
            occupation: updatedProfile.occupation !== undefined ? updatedProfile.occupation : userProfile.occupation,
            sleep_hours: updatedProfile.sleepHours !== undefined ? updatedProfile.sleepHours : userProfile.sleepHours,
            exercise_frequency: updatedProfile.exerciseFrequency !== undefined ? updatedProfile.exerciseFrequency : userProfile.exerciseFrequency,
            screen_time: updatedProfile.screenTime !== undefined ? updatedProfile.screenTime : userProfile.screenTime,
            water_intake: updatedProfile.waterIntake !== undefined ? updatedProfile.waterIntake : userProfile.waterIntake,
            goals: updatedProfile.goals !== undefined ? updatedProfile.goals : userProfile.goals,
            coping_methods: updatedProfile.copingMethods !== undefined ? updatedProfile.copingMethods : userProfile.copingMethods,
            voice_preference: updatedProfile.voicePreference !== undefined ? updatedProfile.voicePreference : userProfile.voicePreference,
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
            occupation: profileData.occupation || '',
            sleepHours: profileData.sleep_hours ? Number(profileData.sleep_hours) : 7,
            exerciseFrequency: profileData.exercise_frequency || '',
            screenTime: profileData.screen_time ? Number(profileData.screen_time) : 6,
            waterIntake: profileData.water_intake ? Number(profileData.water_intake) : 2.5,
            goals: profileData.goals || [],
            copingMethods: profileData.coping_methods || [],
            voicePreference: profileData.voice_preference || 'calm-female',
            theme: profileData.theme || 'light',
            triggers: profileData.notifications?.triggers || [],
            notifications: {
                dailyCheckin: profileData.notifications?.dailyCheckin ?? true,
                weeklySummary: profileData.notifications?.weeklySummary ?? true,
                wellnessReminders: profileData.notifications?.wellnessReminders ?? false,
            },
        }));

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
