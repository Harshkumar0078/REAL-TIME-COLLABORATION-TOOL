import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('cs_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) { setLoading(false); return; }
      try {
        const { data } = await api.get('/auth/me');
        setUser(data.user);
      } catch {
        localStorage.removeItem('cs_token');
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, [token]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('cs_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (username, email, password) => {
    const { data } = await api.post('/auth/register', { username, email, password });
    localStorage.setItem('cs_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const loginAsGuest = async () => {
    const { data } = await api.post('/auth/guest');
    localStorage.setItem('cs_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('cs_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, loginAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
