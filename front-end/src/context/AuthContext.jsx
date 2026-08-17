import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import * as authApi from "../api/authApi";

const TOKEN_KEY = "parkguard_token";
const USER_KEY = "parkguard_user";

const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(
    () => localStorage.getItem(TOKEN_KEY)
  );
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(false);

  const persistSession = useCallback((nextToken, nextUser) => {
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback(
    async ({ email, password }) => {
      setLoading(true);

      try {
        const result = await authApi.login({ email, password });
        persistSession(result.data.token, result.data.user);
        return result;
      } finally {
        setLoading(false);
      }
    },
    [persistSession]
  );

  const signup = useCallback(
    async ({ name, email, password }) => {
      setLoading(true);

      try {
        const result = await authApi.signup({
          name,
          email,
          password,
        });
        persistSession(result.data.token, result.data.user);
        return result;
      } finally {
        setLoading(false);
      }
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token),
      login,
      signup,
      logout,
    }),
    [token, user, loading, login, signup, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
