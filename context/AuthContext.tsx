import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (role: Role) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check session on mount (simulated)
  useEffect(() => {
    const storedRole = localStorage.getItem('shiftflex_role');
    if (storedRole) {
      login(storedRole as Role);
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (role: Role) => {
    setIsLoading(true);
    try {
      const userData = await api.getCurrentUser(role);
      setUser(userData);
      localStorage.setItem('shiftflex_role', role);
    } catch (error) {
      console.error("Login failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('shiftflex_role');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
