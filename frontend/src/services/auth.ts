import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  CheckEmailResponse,
} from "@/types/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export class AuthService {
  private static async parseErrorResponse(
    response: Response,
    defaultMessage: string,
  ): Promise<string> {
    try {
      const errorData = await response.json();
      return errorData.message || errorData.error || defaultMessage;
    } catch (e) {
      console.error("Failed to parse error response:", e);
      return `HTTP ${response.status}: ${response.statusText}`;
    }
  }

  private static handleCatchError(error: unknown, operation: string): string {
    console.error(`${operation} error:`, error);
    return error instanceof Error
      ? error.message
      : "Network error. Please try again.";
  }

  private static async makeAuthRequest(
    endpoint: string,
    data: object,
  ): Promise<Response> {
    return await fetch(`${API_BASE_URL}/api/auth/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      credentials: "include",
    });
  }

  private static storeAuthData(
    data: { token?: string; user_id?: number | string },
    email: string,
  ): void {
    if (data.token && data.user_id) {
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userId", data.user_id.toString());
      localStorage.setItem("userEmail", email);
    }
  }

  private static createLoginSuccessResponse(
    data: { token?: string; user_id?: number | string },
    email: string,
  ): LoginResponse {
    return {
      success: true,
      token: data.token,
      user: {
        id: data.user_id?.toString() || "",
        email: email,
        name: "User", // Will be updated when we fetch profile
      },
    };
  }
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await this.makeAuthRequest("login", credentials);

      if (!response.ok) {
        const errorMessage = await this.parseErrorResponse(
          response,
          "Login failed",
        );
        return {
          success: false,
          error: errorMessage,
        };
      }

      const data = await response.json();
      this.storeAuthData(data, credentials.email);
      return this.createLoginSuccessResponse(data, credentials.email);
    } catch (error) {
      return {
        success: false,
        error: this.handleCatchError(error, "Login"),
      };
    }
  }

  static async checkEmail(email: string): Promise<CheckEmailResponse> {
    try {
      const response = await this.makeAuthRequest("check-email", { email });
      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          available: true,
          message: data.message || "Email is available",
        };
      } else {
        return {
          success: false,
          available: false,
          error: data.message || data.error || "Email check failed",
        };
      }
    } catch (error) {
      return {
        success: false,
        available: false,
        error: this.handleCatchError(error, "Email check"),
      };
    }
  }

  static async register(userData: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await this.makeAuthRequest("register", userData);
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
      return {
        success: false,
        error: this.handleCatchError(error, "Registration"),
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
