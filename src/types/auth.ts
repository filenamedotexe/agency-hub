import { UserRole } from "@prisma/client";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  profileData?: any;
}

export interface SignUpData {
  email: string;
  password: string;
  role: UserRole;
  profileData?: {
    name?: string;
    businessName?: string;
  };
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthError {
  message: string;
  code?: string;
}

export interface AuthSession {
  user: AuthUser | null;
  isLoading: boolean;
  error: AuthError | null;
}
