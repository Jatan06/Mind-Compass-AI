import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyEmail } from './pages/VerifyEmail';
import { ResetPassword } from './pages/ResetPassword';
import { AppLayout } from './layouts/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { DailyCheckIn } from './pages/DailyCheckIn';
import { Journal } from './pages/Journal';
import { Wellness } from './pages/Wellness';
import { Insights } from './pages/Insights';
import { Profile } from './pages/Profile';
import { OnboardingAssessment } from './pages/OnboardingAssessment';
import { AppProvider } from './context/AppContext';

const Layout = () => {
    return (
        <div className="flex flex-col min-h-screen bg-bg-light dark:bg-bg-dark text-text-dark dark:text-text-light transition-colors duration-300">
            <Navbar />
            <main className="flex-grow flex flex-col justify-start">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

function App() {
    return (
        <AppProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Layout />}>
                        <Route index element={<LandingPage />} />
                        <Route path="login" element={<LoginPage />} />
                        <Route path="register" element={<RegisterPage />} />
                        <Route path="verify-email" element={<VerifyEmail />} />
                        <Route path="reset-password" element={<ResetPassword />} />
                    </Route>
                    <Route path="/app" element={<AppLayout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="onboarding" element={<OnboardingAssessment />} />
                        <Route path="checkin" element={<DailyCheckIn />} />
                        <Route path="journal" element={<Journal />} />
                        <Route path="wellness" element={<Wellness />} />
                        <Route path="insights" element={<Insights />} />
                        <Route path="profile" element={<Profile />} />
                    </Route>

                </Routes>
            </Router>
        </AppProvider>
    );
}

export default App;

