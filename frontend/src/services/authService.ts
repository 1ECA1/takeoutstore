
import api from "./api";

export type UserRole = "customer" | "staff" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: string;
  permissions: string[];
  createdAt?: string;
}

interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

interface UserResponse {
  user: AuthUser;
}

export interface ProfileUpdateData {
  name: string;
  email: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export const loginUser = async (
  credentials: LoginCredentials
): Promise<LoginResponse> => {
  const response = await api.post<ApiResponse<LoginResponse>>(
    "/auth/login",
    credentials
  );

  return response.data.data;
};

export const registerUser = async (
  userData: RegisterData
): Promise<AuthUser> => {
  const response = await api.post<ApiResponse<AuthUser>>(
    "/auth/register",
    userData
  );

  return response.data.data;
};

export const getCurrentUser = async (): Promise<AuthUser> => {
  const response = await api.get<ApiResponse<UserResponse>>(
    "/auth/me"
  );

  return response.data.data.user;
};

export const updateMyProfile = async (
  profileData: ProfileUpdateData
): Promise<AuthUser> => {
  const response = await api.patch<ApiResponse<UserResponse>>(
    "/auth/me",
    profileData
  );

  return response.data.data.user;
};

export const changeMyPassword = async (
  passwordData: ChangePasswordData
): Promise<string> => {
  const response = await api.patch<ApiResponse<null>>(
    "/auth/change-password",
    passwordData
  );

  return response.data.message;
};
