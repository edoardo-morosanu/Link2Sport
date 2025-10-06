import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  CheckEmailResponse,
} from "@/types/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export class AuthService {
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
        credentials: "include",
      });

      if (!response.ok) {
        let errorMessage = "Login failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          console.error("Failed to parse error response:", e);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }

        return {
          success: false,
          error: errorMessage,
        };
      }

      const data = await response.json();

      // Store JWT token and user info
      if (data.token && data.user_id) {
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("userId", data.user_id.toString());
        localStorage.setItem("userEmail", credentials.email);
      }

      return {
        success: true,
        token: data.token,
        user: {
          id: data.user_id?.toString() || "",
          email: credentials.email,
          name: "User", // Will be updated when we fetch profile
        },
      };
    } catch (error) {
      console.error("Login error:", error);

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Network error. Please try again.",
      };
    }
  }

  static async checkEmail(email: string): Promise<CheckEmailResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/check-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        // Email is available
        return {
          success: true,
          available: true,
          message: data.message || "Email is available",
        };
      } else {
        // Email already exists or other error
        return {
          success: false,
          available: false,
          error: data.message || data.error || "Email check failed",
        };
      }
    } catch (error) {
      console.error("Email check error:", error);
      return {
        success: false,
        available: false,
        error:
          error instanceof Error
            ? error.message
            : "Network error. Please try again.",
      };
    }
  }

  static async register(userData: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          message: data.message || "Registration successful",
        };
      } else {
        return {
          success: false,
          error: data.message || data.error || "Registration failed",
        };
      }
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Network error. Please try again.",
      };
    }
  }

  static getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("authToken");
    }
    return null;
  }

  static logout(): void {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
  }

  static getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("authToken");
    }
    return null;
  }

  static getUserId(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("userId");
    }
    return null;
  }

  static getUserEmail(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("userEmail");
    }
    return null;
  }

  static isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getUserId();
  }

  static getCurrentUser() {
    const userId = this.getUserId();
    const userEmail = this.getUserEmail();

    if (userId && userEmail) {
      return {
        id: userId,
        email: userEmail,
        name: "User",
      };
    }
    return null;
  }
}
