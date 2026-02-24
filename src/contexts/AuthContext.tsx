import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode, useRef, useMemo } from 'react';
import type { User } from '../types';
import { Role } from '../constants';
import { useToast } from './ToastContext';
import * as api from '../services/api';


interface SocialProfile {
  name: string;
  email: string;
  profileImage: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string, role: Role, phoneNumber?: string, profileImage?: string) => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  loginWithUser: (user: User, token?: string) => void;
  socialLogin: (profile: SocialProfile) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logout = useCallback(() => {
    localStorage.removeItem('authUser');
    localStorage.removeItem('isAuthenticated');
    setUser(null);
    if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
    }
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
    }
    inactivityTimer.current = setTimeout(() => {
        addToast("Session expired for security reasons.", "info");
        logout();
    }, INACTIVITY_TIMEOUT);
  }, [logout, addToast]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
    
    if (user) {
        events.forEach(event => window.addEventListener(event, resetInactivityTimer));
        resetInactivityTimer(); // Start the timer on login
    }

    return () => {
        events.forEach(event => window.removeEventListener(event, resetInactivityTimer));
        if (inactivityTimer.current) {
            clearTimeout(inactivityTimer.current);
        }
    };
  }, [user, resetInactivityTimer]);

  useEffect(() => {
    const checkAuth = async () => {
        const storedAuth = localStorage.getItem('isAuthenticated');
        const storedUser = localStorage.getItem('authUser');
        const token = localStorage.getItem('authToken');
        if (storedAuth && storedUser) {
            try {
                const currentUser = JSON.parse(storedUser);
                setUser(currentUser);
                // if we have a token, try refreshing from server
                if (token) {
                    try {
                        const fresh = await api.apiGetCurrentUser();
                        setUser(fresh);
                        localStorage.setItem('authUser', JSON.stringify(fresh));
                    } catch (err) {
                        console.warn('Failed to refresh user from API', err);
                    }
                }
            } catch (error) {
                console.error("Failed to parse user from localStorage", error);
                logout();
            }
        }
        setLoading(false);
    };
    checkAuth();
  }, [logout]);

  const login = useCallback(async (email: string, pass: string) => {
    // call network login; returns either {user, token} from mock or full user object with token from backend
    const resp: any = await api.apiLogin(email, pass);
    let loggedInUser: User;
    let token: string | undefined;

    if (resp.user) {
      loggedInUser = resp.user;
      token = resp.token;
    } else {
      // assume resp itself is user-like
      loggedInUser = resp as User & { token?: string };
      token = loggedInUser.token as string;
    }

    if (token) {
      localStorage.setItem('authToken', token);
    }

    let userToStore = loggedInUser;
    if (loggedInUser.role === Role.Farmer && loggedInUser.hasReceivedSupportGrant && !loggedInUser.hasSeenGrantToast) {
      addToast('Welcome! Your ₣500,000 XAF support grant is now in your wallet, ready to use or withdraw.', 'success');
      // update via API if possible
      if (api.apiUpdateUserProfile) {
        userToStore = await api.apiUpdateUserProfile({ id: loggedInUser._id || loggedInUser.id, hasSeenGrantToast: true });
      }
    }

    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('authUser', JSON.stringify(userToStore));
    setUser(userToStore);
  }, [addToast]);

  const loginWithUser = useCallback((loggedInUser: User, token?: string) => {
    if (token) {
      localStorage.setItem('authToken', token);
    }
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('authUser', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, role: Role) => {
    // call backend to create user, then automatically log in
    const resp: any = await api.apiRegister(name, email, password, role);
    let userObj: any;
    let token: string | undefined;
    if (resp.user) {
      userObj = resp.user;
      token = resp.token;
    } else {
      userObj = resp;
      token = resp.token;
    }
    if (token) localStorage.setItem('authToken', token);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('authUser', JSON.stringify(userObj));
    setUser(userObj);
  }, []);
  
  const updateUser = useCallback((data: Partial<User>) => {
    setUser(prevUser => {
        if (!prevUser) return null;
        const updated = { ...prevUser, ...data };
        localStorage.setItem('authUser', JSON.stringify(updated));
        return updated;
    });
  }, []);

  const socialLogin = useCallback(async (profile: SocialProfile) => {
    // backend currently does not support social login, so fallback to mock
    const { user: loggedInUser, token } = await api.socialLogin(profile as any);
    if (token) localStorage.setItem('authToken', token);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('authUser', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  }, []);

  
  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    register,
    updateUser,
    loginWithUser,
    socialLogin,
  }), [user, loading, login, logout, register, updateUser, loginWithUser, socialLogin]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};