/**
 * @fileoverview App — root component that wires up routing and providers.
 *
 * Provider hierarchy (outer to inner):
 *   BrowserRouter → ApiProvider → UserProvider
 *
 * ApiProvider must be outside UserProvider because UserProvider calls useApi().
 * UserProvider must wrap all routes because PrivateRoute/PublicRoute call useUser().
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ApiProvider from './contexts/ApiProvider';
import UserProvider from './contexts/UserProvider';
import Header from './components/Header';
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OnboardingPage from './pages/OnboardingPage';
import DiscoveryPage from './pages/DiscoveryPage';
import MatchesPage from './pages/MatchesPage';
import MessagesPage from './pages/MessagesPage';
import ProfilePage from './pages/ProfilePage';
import ProfileDetailPage from './pages/ProfileDetailPage';

/**
 * Root application component.
 *
 * Wraps the entire app in the required provider hierarchy and defines all
 * client-side routes. Public routes redirect authenticated users to /discovery.
 * Private routes redirect unauthenticated users to /login.
 *
 * @returns {JSX.Element} The full application.
 */
export default function App() {
  return (
    <BrowserRouter>
      <ApiProvider>
        <UserProvider>
          <Header />
          <Routes>
            {/* Public routes — redirect to /discovery when authenticated */}
            <Route
              path="/"
              element={
                <PublicRoute>
                  <LandingPage />
                </PublicRoute>
              }
            />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />

            {/* Private routes — redirect to /login when unauthenticated */}
            <Route
              path="/onboarding"
              element={
                <PrivateRoute>
                  <OnboardingPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/discovery"
              element={
                <PrivateRoute>
                  <DiscoveryPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/matches"
              element={
                <PrivateRoute>
                  <MatchesPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <PrivateRoute>
                  <MessagesPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/messages/:matchId"
              element={
                <PrivateRoute>
                  <MessagesPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <ProfilePage />
                </PrivateRoute>
              }
            />
            <Route
              path="/profiles/:userId"
              element={
                <PrivateRoute>
                  <ProfileDetailPage />
                </PrivateRoute>
              }
            />

            {/* Catch-all — redirect unknown paths to landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </UserProvider>
      </ApiProvider>
    </BrowserRouter>
  );
}
