import React, { createContext, useContext, useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for saved user session
    const savedUser = localStorage.getItem('currentUser');
    const savedSession = localStorage.getItem('userSession');
    
    if (savedUser && savedSession) {
      try {
        const user = JSON.parse(savedUser);
        const session = JSON.parse(savedSession);
        
        // Check if session is still valid (24 hours)
        const sessionTime = new Date(session.timestamp);
        const now = new Date();
        const timeDiff = now.getTime() - sessionTime.getTime();
        const hoursDiff = timeDiff / (1000 * 3600);
        
        if (hoursDiff < 24) {
          setCurrentUser(user);
          setIsAuthenticated(true);
        } else {
          // Session expired
          localStorage.removeItem('currentUser');
          localStorage.removeItem('userSession');
        }
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userSession');
      }
    }
    
    setLoading(false);
  }, []);

  const login = async (username, role = 'subscriber') => {
    if (!username || username.trim().length < 2) {
      toast.error('Username minimal 2 karakter');
      return false;
    }

    setLoading(true);
    try {
      // Check if user exists or create new user
      const response = await userAPI.loginOrCreate({
        username: username.trim(),
        role: role
      });

      if (response.success) {
        const user = response.data;
        setCurrentUser(user);
        setIsAuthenticated(true);
        
        // Save to localStorage
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('userSession', JSON.stringify({
          timestamp: new Date().toISOString(),
          userId: user.id
        }));
        
        toast.success(`Selamat datang, ${user.name}!`);
        return true;
      } else {
        toast.error(response.error || 'Login failed');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.error || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userSession');
    toast.success('Logout berhasil');
  };

  const updateUserRole = (newRole) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, role: newRole };
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
  };

  const value = {
    currentUser,
    loading,
    isAuthenticated,
    login,
    logout,
    updateUserRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
