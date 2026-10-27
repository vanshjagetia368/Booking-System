import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import authService from '../services/authService.js';
import { isAuthError, isNetworkError } from '../../../utils/error.js';

export const AuthContext = createContext(null);

/**
 * Global Authentication Provider
 *
 * Maintains the client-side authentication state, handles initial session resolution,
 * and provides login, registration, logout, and session refresh capabilities.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [authError, setAuthError] = useState(null);

  /**
   * Resolves the initial session on application mount.
   */
  const initSession = useCallback(async () => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const data = await authService.getMe();
      if (data && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      if (isAuthError(err)) {
        // Expected for unauthenticated visitors or expired tokens
        setUser(null);
      } else if (isNetworkError(err)) {
        // Distinguish network connection issue from confirmed logout
        console.warn('Network unavailable during session initialization. Starting in unauthenticated state.');
        setUser(null);
        setAuthError(err);
      } else {
        setUser(null);
      }
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    initSession();
  }, [initSession]);

  /**
   * Authenticates user credentials and populates session state.
   */
  const login = useCallback(async ({ email, password }) => {
    setAuthError(null);
    const data = await authService.login({ email, password });
    if (data && data.user) {
      setUser(data.user);
      return data.user;
    }
    throw new Error('Authentication succeeded but user profile was missing.');
  }, []);

  /**
   * Registers a new account and populates session state.
   * Note: The backend establishes a session immediately upon registration.
   */
  const register = useCallback(async ({ name, email, password }) => {
    setAuthError(null);
    const data = await authService.register({ name, email, password });
    if (data && data.user) {
      setUser(data.user);
      return data.user;
    }
    throw new Error('Registration succeeded but user profile was missing.');
  }, []);

  /**
   * Terminates the current session on the backend and clears local state.
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (err) {
      // Even if network or backend fails, always clear client session
      console.warn('Backend logout encountered error, clearing client session locally:', err?.message);
    } finally {
      setUser(null);
      setAuthError(null);
    }
  }, []);

  /**
   * Refreshes the currently authenticated user's profile from the server.
   */
  const refreshUser = useCallback(async () => {
    try {
      const data = await authService.getMe();
      if (data && data.user) {
        setUser(data.user);
        return data.user;
      }
      setUser(null);
      return null;
    } catch (err) {
      if (isAuthError(err)) {
        setUser(null);
      }
      throw err;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      isLoading,
      isInitialized,
      authError,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, isLoading, isInitialized, authError, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
