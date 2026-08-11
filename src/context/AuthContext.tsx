import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { normalizeRoles, type RoleId } from '../config/roles';

export interface RoleRef {
  id: number;
  name: string;
  description: string;
}

export interface User {
  id: number;
  national_id: string;
  first_name: string;
  last_name: string;
  email: string;
  faculty_institution: string;
  role_id: number | null;
  role?: RoleRef | null;
  roles?: RoleRef[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  roleIds: RoleId[];
  login: (email: string, password: string) => Promise<void>;
  register: (data: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const roleIds = normalizeRoles(user?.role, user?.roles);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('access_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      setToken(storedToken);

      try {
        const storedUser = localStorage.getItem('user_data');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser) as User);
          } catch {
            localStorage.removeItem('user_data');
          }
        }

        // La fuente de verdad de roles es siempre /me (no localStorage).
        const response = await api.get('/me');
        const freshUser = response.data.data as User;
        setUser(freshUser);
        localStorage.setItem('user_data', JSON.stringify(freshUser));
      } catch {
        logoutState();
      }

      setLoading(false);
    };

    void initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post('/login', { email, password });
      const { access_token, user: loggedUser } = response.data.data;

      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user_data', JSON.stringify(loggedUser));

      setToken(access_token);
      setUser(loggedUser);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: Record<string, unknown>) => {
    setLoading(true);
    try {
      const response = await api.post('/register', data);
      const { access_token, user: registeredUser } = response.data.data;

      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user_data', JSON.stringify(registeredUser));

      setToken(access_token);
      setUser(registeredUser);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errors = err.response?.data?.errors;
      const message = err.response?.data?.message || 'Error en el registro';
      if (errors) {
        const errorList = Object.values(errors).flat().join(', ');
        throw new Error(`${message}: ${errorList}`);
      }
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await api.post('/logout');
    } catch {
      // ignore
    } finally {
      logoutState();
      setLoading(false);
    }
  };

  const logoutState = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    setToken(null);
    setUser(null);
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/me');
      const currentUser = response.data.data;
      setUser(currentUser);
      localStorage.setItem('user_data', JSON.stringify(currentUser));
    } catch {
      logoutState();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        roleIds,
        login,
        register,
        logout,
        fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
