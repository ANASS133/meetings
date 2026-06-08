import { useState, useCallback } from 'react';
import api from '../api/api';
import { AuthContext, ROLES } from './auth';

const getStoredUser = () => {
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');

  if (!token || !storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return null;
  }
};

export { ROLES };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);

  const login = useCallback(async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    const { token, ...userData } = response.data;

    // Ensure role defaults to USER if not provided by backend
    if (!userData.role) {
      userData.role = ROLES.USER;
    }

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const isAdmin = user?.role === ROLES.ADMIN;
  const isPhotographer = user?.role === ROLES.PHOTOGRAPHER;
  const isStaff = isAdmin || isPhotographer;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: false,
        login,
        logout,
        isAuthenticated: !!user,
        isAdmin,
        isPhotographer,
        isStaff,
        ROLES,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
