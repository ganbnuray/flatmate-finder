/**
 * @fileoverview PublicRoute component — guards routes that should only be
 * accessible when the user is NOT authenticated (landing, login, register).
 *
 * Handles three distinct auth states:
 *   user === undefined → auth check still loading, render nothing
 *   user is Object     → confirmed authenticated, redirect to /discovery
 *   user === null      → confirmed unauthenticated, render children
 */

import { Navigate } from 'react-router-dom';
import { useUser } from '../contexts/UserProvider';

/**
 * Wraps a public route and redirects authenticated users to the discovery feed.
 *
 * Renders null during the loading phase (user === undefined) to prevent
 * a flash of the public page before the auth check completes.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The public page to render.
 * @returns {JSX.Element|null} Children, a redirect, or null while loading.
 */
export default function PublicRoute({ children }) {
  const { user } = useUser();

  // Still resolving auth — show nothing to prevent flash of auth page.
  if (user === undefined) return null;

  // Confirmed authenticated — redirect away from public pages.
  if (user) return <Navigate to="/discovery" replace />;

  return children;
}
