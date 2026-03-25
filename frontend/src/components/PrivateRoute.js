/**
 * @fileoverview PrivateRoute component — guards routes that require auth.
 *
 * Handles three distinct auth states to prevent UI flashes:
 *   user === undefined → auth check still loading, render nothing
 *   user === null      → confirmed unauthenticated, redirect to /login
 *   user is Object     → confirmed authenticated, render children
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserProvider';

/**
 * Wraps a route and redirects unauthenticated users to the login page.
 *
 * Renders null during the loading phase (user === undefined) to prevent
 * a flash of the protected page before the auth check completes.
 * Authenticated users with incomplete profiles are redirected to /onboarding
 * (unless they are already on that page).
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The protected page to render.
 * @returns {JSX.Element|null} Children, a redirect, or null while loading.
 */
export default function PrivateRoute({ children }) {
  const { user } = useUser();
  const location = useLocation();

  // Still resolving auth — show nothing to prevent flash of protected content.
  if (user === undefined) return null;

  // Confirmed unauthenticated — redirect to login.
  if (!user) return <Navigate to="/login" replace />;

  // Profile incomplete — redirect to onboarding (skip if already there).
  if (user.is_complete === false && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}
