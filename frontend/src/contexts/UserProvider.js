/**
 * @fileoverview UserContext provider — manages authentication state and
 * exposes named operations for auth-related mutations.
 *
 * Auth state follows a three-value pattern:
 *   undefined → still loading (auth check in flight, render nothing)
 *   null      → confirmed unauthenticated
 *   Object    → confirmed authenticated user
 *
 * All operations that mutate the current user (login, register, logout,
 * updateProfile) live here as useCallback functions. Pages and components
 * call the named operations — they never call api.anything() directly for
 * user-state mutations.
 *
 * Auth state is verified against the Flask backend on mount via GET /profiles/me.
 * Session is maintained by the backend via cookies (credentials: 'include').
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useApi } from './ApiProvider';

const UserContext = createContext(null);

/**
 * Provides user authentication state and named auth operations to the tree.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Descendant components.
 * @returns {JSX.Element} The context provider wrapping children.
 */
export default function UserProvider({ children }) {
  // undefined = loading, null = unauthenticated, Object = authenticated
  const [user, setUser] = useState(undefined);
  const api = useApi();

  // Only verify session with the backend if there's a hint that a session exists.
  // This avoids a 401 console error on every page load when the user is not logged in.
  useEffect(() => {
    if (!localStorage.getItem('flatmate_session')) {
      setUser(null);
      return;
    }
    async function checkSession() {
      try {
        const response = await api.getCurrentUser();
        if (response.ok) {
          setUser(response.body);
        } else if (response.status === 404) {
          setUser({ is_complete: false });
        } else {
          localStorage.removeItem('flatmate_session');
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    }
    checkSession();
  }, [api]);

  /**
   * Logs in the user with the given credentials.
   *
   * Stores the returned user in context and localStorage so the session
   * survives page refreshes.
   *
   * @param {string} email - User's email address.
   * @param {string} password - User's password.
   * @returns {Promise<{ok: boolean, error?: string}>}
   */
  const login = useCallback(
    async (email, password) => {
      const response = await api.login(email, password);
      if (response.ok) {
        localStorage.setItem('flatmate_session', '1');
        // Fetch profile to get full user data (including is_complete)
        const profileResponse = await api.getCurrentUser();
        if (profileResponse.ok) {
          setUser({ email: response.body.email, ...profileResponse.body });
        } else {
          setUser({ user_id: response.body.user_id, email: response.body.email, is_complete: false });
        }
        return { ok: true };
      }
      if (response.status === 401) {
        return { ok: false, error: 'Invalid email or password.' };
      }
      if (response.status === 403) {
        return { ok: false, error: 'This account has been deactivated. Contact support for help.' };
      }
      if (response.status === 400) {
        return { ok: false, error: 'Please enter your email and password.' };
      }
      if (response.status === 0) {
        return { ok: false, error: 'Network error. Check your connection and try again.' };
      }
      return { ok: false, error: 'Login failed. Please try again.' };
    },
    [api],
  );

  /**
   * Registers a new account and immediately logs the user in.
   *
   * The returned user has is_complete: false, triggering the onboarding flow.
   *
   * @param {string} email - The new account's email address.
   * @param {string} password - The new account's password.
   * @returns {Promise<{ok: boolean, error?: string, code?: string}>}
   */
  const register = useCallback(
    async (email, password) => {
      const response = await api.register(email, password);
      if (response.ok) {
        localStorage.setItem('flatmate_session', '1');
        setUser({ user_id: response.body.user_id, email: response.body.email, is_complete: false });
        return { ok: true };
      }
      if (response.status === 409) {
        return { ok: false, error: 'An account with this email already exists.', code: 'email_taken' };
      }
      if (response.status === 400) {
        return { ok: false, error: 'Please enter a valid email and password.' };
      }
      if (response.status === 0) {
        return { ok: false, error: 'Network error. Check your connection and try again.' };
      }
      return { ok: false, error: 'Registration failed. Please try again.' };
    },
    [api],
  );

  /**
   * Logs out the current user and clears session state.
   *
   * @returns {Promise<void>}
   */
  const logout = useCallback(async () => {
    await api.logout();
    localStorage.removeItem('flatmate_session');
    setUser(null);
  }, [api]);

  /**
   * Updates the current user's profile and syncs shared auth state.
   *
   * Calls the API, then updates both the user context and localStorage so
   * all consumers (Header, ProfilePage, etc.) reflect the change immediately
   * without a page refresh.
   *
   * @param {Object} profileData - Partial or full profile fields to update.
   * @returns {Promise<{ok: boolean, error?: string}>}
   */
  const updateProfile = useCallback(
    async (profileData) => {
      const response = await api.updateProfile(profileData);
      if (response.ok) {
        setUser(prev => ({ ...prev, ...response.body }));
        return { ok: true };
      }
      return { ok: false, error: 'Failed to update profile. Please try again.' };
    },
    [api],
  );

  return (
    <UserContext.Provider value={{ user, login, logout, register, updateProfile }}>
      {children}
    </UserContext.Provider>
  );
}

/**
 * Returns the current user context value from the nearest UserProvider.
 *
 * Returns { user, login, logout, register, updateProfile }.
 *
 * @returns {{ user: Object|null|undefined, login: Function, logout: Function, register: Function, updateProfile: Function }}
 */
export function useUser() {
  return useContext(UserContext);
}
