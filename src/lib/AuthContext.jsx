/**
 * Purpose: Manage client-side auth state for the V-TEKI app with local/manual session handling.
 * Used by: `App`, protected routes, layout components, and auth-aware pages.
 * Main dependencies: React context/hooks and the app client adapter.
 * Public/main functions: `AuthProvider` and `useAuth`.
 * Important side effects: Reads persisted session state and triggers browser redirects for login/logout flows.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { appClient } from '@/api/appClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState({ mode: 'local' });

  const checkUserAuth = async () => {
    setIsLoadingAuth(true);
    try {
      const currentUser = await appClient.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      setAuthError(error?.status === 401 ? null : { type: 'unknown', message: error.message });
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const checkAppState = async () => {
    setIsLoadingPublicSettings(true);
    setAppPublicSettings({ mode: 'local' });
    setAuthError(null);
    await checkUserAuth();
    setIsLoadingPublicSettings(false);
  };

  useEffect(() => {
    checkAppState();
  }, []);

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    setAuthChecked(true);
    setAuthError(null);
    appClient.auth.logout(shouldRedirect ? '/' : undefined);
  };

  const navigateToLogin = () => {
    appClient.auth.redirectToLogin('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        authChecked,
        logout,
        navigateToLogin,
        checkUserAuth,
        checkAppState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
