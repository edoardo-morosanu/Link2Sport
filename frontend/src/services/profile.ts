import { AuthService } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export class ProfileService {
  static async getProfile() {
    const token = AuthService.getToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          AuthService.logout();
          throw new Error("Authentication expired. Please login again.");
        }
        throw new Error("Failed to fetch profile");
      }

      return await response.json();
    } catch (error) {
      console.error("Profile fetch error:", error);
      throw error;
    }
  }

  static async updateProfile(profileData: unknown) {
    const token = AuthService.getToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          AuthService.logout();
          throw new Error("Authentication expired. Please login again.");
        }
        throw new Error("Failed to update profile");
      }

      return await response.json();
    } catch (error) {
      console.error("Profile update error:", error);
      throw error;
    }
  }
}
