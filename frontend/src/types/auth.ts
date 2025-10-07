export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    username?: string;
  };
  error?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
  username: string;
  location: string;
  sports: string[];
  bio?: string;
  avatar?: File;
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface CheckEmailResponse {
  success: boolean;
  available?: boolean;
  message?: string;
  error?: string;
}

export interface AuthContextType {
  user: any | null;
  login: (credentials: LoginRequest) => Promise<LoginResponse>;
  logout: () => void;
  isLoading: boolean;
}

export interface ApiProfileResponse {
  id: number;
  username: string;
  email: string;
  display_name: string;
  bio: string;
  city: string;
  country: string;
  sports: string[];
  avatar_url: string;
  has_avatar: boolean;
  created_at: string;
  updated_at: string;
}
