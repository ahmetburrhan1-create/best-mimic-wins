import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('taklit_auth_token') || null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login'); // 'login' | 'register' | 'profile'

  // Verify and fetch profile on load
  useEffect(() => {
    const fetchUser = async () => {
      const storedToken = localStorage.getItem('taklit_auth_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${storedToken}` }
        });
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
          setToken(storedToken);
        } else {
          localStorage.removeItem('taklit_auth_token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Error verifying token:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = useCallback(async ({ username, password }) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success && data.token && data.user) {
        localStorage.setItem('taklit_auth_token', data.token);
        setToken(data.token);
        setUser(data.user);
        setShowAuthModal(false);
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error || 'Giriş yapılamadı.' };
    } catch (err) {
      return { success: false, error: 'Bağlantı hatası oluştu.' };
    }
  }, []);

  const register = useCallback(async ({ username, password, displayName, avatar }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, displayName, avatar })
      });
      const data = await res.json();
      if (data.success && data.token && data.user) {
        localStorage.setItem('taklit_auth_token', data.token);
        setToken(data.token);
        setUser(data.user);
        setShowAuthModal(false);
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error || 'Kayıt olunamadı.' };
    } catch (err) {
      return { success: false, error: 'Bağlantı hatası oluştu.' };
    }
  }, []);

  const updateProfile = useCallback(async ({ displayName, avatar }) => {
    if (!token) return { success: false, error: 'Oturum açılmamış.' };
    try {
      const res = await fetch('/api/auth/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ displayName, avatar })
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error || 'Profil güncellenemedi.' };
    } catch (err) {
      return { success: false, error: 'Bağlantı hatası.' };
    }
  }, [token]);

  const logout = useCallback(async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (e) {
        // ignore network error on logout
      }
    }
    localStorage.removeItem('taklit_auth_token');
    setToken(null);
    setUser(null);
    setShowAuthModal(false);
  }, [token]);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
      }
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  }, [token]);

  const openAuth = useCallback((tab = 'login') => {
    setAuthModalTab(tab);
    setShowAuthModal(true);
  }, []);

  const closeAuth = useCallback(() => {
    setShowAuthModal(false);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAuthenticated: !!user,
      showAuthModal,
      authModalTab,
      setAuthModalTab,
      openAuth,
      closeAuth,
      login,
      register,
      logout,
      updateProfile,
      refreshUser
    }}>
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

export default AuthContext;
