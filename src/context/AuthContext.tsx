import { createContext, useContext, useState } from 'react';
import { login as apiLogin, register as apiRegister, getToken as loadToken, setToken as storeToken, clearToken as removeToken } from '@/utils/api';

interface AuthContextType {
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  register: (username: string, email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  login: async () => {},
  logout: () => {},
  register: async () => {}
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => loadToken());

  const login = async (username: string, password: string) => {
    const newToken = await apiLogin(username, password);
    storeToken(newToken);
    setToken(newToken);
  };

  const register = async (username: string, email: string, password: string) => {
    await apiRegister(username, email, password);
  };

  const logout = () => {
    removeToken();
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
