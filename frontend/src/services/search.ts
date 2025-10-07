import {
  SearchRequest,
  SearchUsersResponse,
  PublicUserProfile,
} from "@/types/search";
import { AuthService } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export class SearchService {
  private static getAuthHeaders() {
    const token = AuthService.getToken();
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  static async searchUsers(
    request: SearchRequest,
  ): Promise<SearchUsersResponse> {
    try {
      const params = new URLSearchParams({
        q: request.q,
        limit: (request.limit || 10).toString(),
        offset: (request.offset || 0).toString(),
      });

      const response = await fetch(
        `${API_BASE_URL}/api/search/users?${params}`,
        {
          method: "GET",
          headers: this.getAuthHeaders(),
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Search error:", error);
      throw error;
    }
  }

  static async getUserProfile(userId: number): Promise<PublicUserProfile> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user profile: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Get user profile error:", error);
      throw error;
    }
  }
}
