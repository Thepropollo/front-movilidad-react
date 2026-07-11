import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export interface User {
  id: number;
  national_id: string;
  first_name: string;
  last_name: string;
  email: string;
  faculty_institution: string;
  role_id: number | null;
  role?: {
    id: number;
    name: string;
    description: string;
  } | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Inicializar cargando el token del almacenamiento local
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user_data');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Verificar el token con el servidor de forma asíncrona
        try {
          const response = await api.get('/me');
          const freshUser = response.data.data;
          setUser(freshUser);
          localStorage.setItem('user_data', JSON.stringify(freshUser));
        } catch (error) {
          // Si el token es inválido o expiró, limpiar la sesión
          console.error('Error al verificar sesión:', error);
          logoutState();
        }
      }
      setLoading(false);
    };

    initializeAuth();
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
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al iniciar sesión';
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: any) => {
    setLoading(true);
    try {
      const response = await api.post('/register', data);
      const { access_token, user: registeredUser } = response.data.data;
      
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user_data', JSON.stringify(registeredUser));
      
      setToken(access_token);
      setUser(registeredUser);
    } catch (error: any) {
      const errors = error.response?.data?.errors;
      const message = error.response?.data?.message || 'Error en el registro';
      if (errors) {
        // Concatenar todos los mensajes de error de validación
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
    } catch (error) {
      console.error('Error al cerrar sesión en servidor:', error);
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
    } catch (error) {
      logoutState();
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    loading,
    login,
    register,
    logout,
    fetchCurrentUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
