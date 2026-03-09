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
 * Auth simulation: the user object is persisted to localStorage under
 * 'flatmate_auth'. When the Flask backend lands, replace localStorage
 * reads/writes with session cookie handling (credentials: 'include').
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

  // Restore session from localStorage on initial mount.
  // Wrapped in try/catch: if the stored value is corrupted or partially
  // written, JSON.parse throws and we fall back to unauthenticated rather
  // than crashing the app on mount.
  useEffect(() => {
    const stored = localStorage.getItem('flatmate_auth');
    try {
      setUser(stored ? JSON.parse(stored) : null);
    } catch {
      setUser(null);
    }
  }, []);

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
        localStorage.setItem('flatmate_auth', JSON.stringify(response.body.user));
        setUser(response.body.user);
        return { ok: true };
      }
      return { ok: false, error: 'Invalid email or password.' };
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
   * @returns {Promise<{ok: boolean, error?: string}>}
   */
  const register = useCallback(
    async (email, password) => {
      const response = await api.register(email, password);
      if (response.ok) {
        localStorage.setItem('flatmate_auth', JSON.stringify(response.body.user));
        setUser(response.body.user);
        return { ok: true };
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
    localStorage.removeItem('flatmate_auth');
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
        const updatedUser = response.body.user;
        localStorage.setItem('flatmate_auth', JSON.stringify(updatedUser));
        setUser(updatedUser);
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
