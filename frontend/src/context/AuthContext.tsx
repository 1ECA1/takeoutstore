
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  loginUser,
  registerUser,
  getCurrentUser,
  updateMyProfile,
  type AuthUser,
  type LoginCredentials,
  type RegisterData,
  type ProfileUpdateData,
} from "../services/authService";

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  register: (data: RegisterData) => Promise<AuthUser>;
  updateProfile: (data: ProfileUpdateData) => Promise<AuthUser>;
  logout: () => void;
}

export const AuthContext = createContext<
  AuthContextType | undefined
>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({
  children,
}: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    setUser(null);
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const result = await loginUser(credentials);

      localStorage.setItem("accessToken", result.accessToken);
      setUser(result.user);

      return result.user;
    },
    []
  );

  const register = useCallback(
    async (data: RegisterData) => {
      return registerUser(data);
    },
    []
  );

  const updateProfile = useCallback(
    async (data: ProfileUpdateData) => {
      const updatedUser = await updateMyProfile(data);

      setUser((currentUser) =>
        currentUser
          ? { ...currentUser, ...updatedUser }
          : updatedUser
      );

      return updatedUser;
    },
    []
  );

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch {
        localStorage.removeItem("accessToken");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void restoreSession();
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      register,
      updateProfile,
      logout,
    }),
    [user, isLoading, login, register, updateProfile, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
