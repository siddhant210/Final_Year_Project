import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AnimatePresence } from "framer-motion";
import { ThemeProvider } from "./context/ThemeContext";
import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import SignUpPage from "./pages/auth/SignUpPage";
import LoginPage from "./pages/auth/LoginPage";
import Profile from "./pages/profile/Profile";
import ProfileSetup from "./pages/profile/ProfileSetup";
import Dashboard from "./pages/dashboard/Dashboard";
import MonitoringDashboard from "./pages/dashboard/MonitoringDashboard";
import ActivitySummaryPage from "./pages/health-data/ActivitySummaryPage";
import BloodOxygenPage from "./pages/health-data/BloodOxygenPage";
import BodyTemperaturePage from "./pages/health-data/BodyTemperaturePage";
import Exercise from "./pages/health-data/Exercise";
import HeartRatePage from "./pages/health-data/HeartRatePage";
import SleepPage from "./pages/health-data/SleepPage";
import WeightPage from "./pages/health-data/WeightPage";
import DietRecommendations from "./pages/Other/DietRecommendations";
import Documents from "./pages/Other/Documents";
import Medication from './pages/Other/Medication';
import useAuth from "./hooks/useAuth";
import HeartRateMonitor from './pages/Other/HearRateMonitor';
import AIBotsPage from './pages/ai/AIBotsPage'; 

function App() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-200">
          {isAuthenticated && (
            <div className="sticky top-0 z-50">
              <Navbar isAuthenticated={isAuthenticated} onLogout={logout} />
            </div>
          )}

          <main className={isAuthenticated ? "pt-16" : ""}>
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/profile-setup" element={isAuthenticated ? <ProfileSetup /> : <LoginPage />} />
                <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <LoginPage />} />
                <Route path="/exercise" element={isAuthenticated ? <Exercise /> : <LoginPage />} />
                <Route path="/profile" element={isAuthenticated ? <Profile /> : <LoginPage />} />
                <Route path="/diet" element={isAuthenticated ? <DietRecommendations /> : <LoginPage />} />
                <Route path="/monitoring" element={isAuthenticated ? <MonitoringDashboard /> : <LoginPage />} />
                <Route path="/monitoring/heart-rate" element={isAuthenticated ? <HeartRatePage /> : <LoginPage />} />
                <Route path="/monitoring/sleep" element={isAuthenticated ? <SleepPage /> : <LoginPage />} />
                <Route path="/monitoring/blood-oxygen" element={isAuthenticated ? <BloodOxygenPage /> : <LoginPage />} />
                <Route path="/monitoring/temperature" element={isAuthenticated ? <BodyTemperaturePage /> : <LoginPage />} />
                <Route path="/monitoring/weight" element={isAuthenticated ? <WeightPage /> : <LoginPage />} />
                <Route path="/monitoring/exercise" element={isAuthenticated ? <Exercise /> : <LoginPage />} />
                <Route path="/medication" element={isAuthenticated ? <Medication /> : <LoginPage />} />
                <Route path="/activity-summary" element={isAuthenticated ? <ActivitySummaryPage /> : <LoginPage />} />
                <Route path="/documents" element={isAuthenticated ? <Documents /> : <LoginPage />} />
                <Route path="/heart-rate-monitor" element={<HeartRateMonitor />} />
                <Route path="/ai" element={isAuthenticated ? <AIBotsPage /> : <LoginPage />} />
              </Routes>
            </AnimatePresence>
          </main>

          <Toaster position="bottom-right" />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;