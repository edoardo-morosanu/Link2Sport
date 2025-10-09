import {
  FollowResponse,
  FollowStatsResponse,
  FollowersListResponse,
  FollowingListResponse,
  FollowError,
} from "@/types/follow";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export class FollowService {
  private static getAuthHeaders(): HeadersInit {
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorData: FollowError;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          error: `HTTP ${response.status}`,
          message: response.statusText || "Request failed",
        };
      }
      throw errorData;
    }
    return response.json();
  }

  private static handleCatchError(error: unknown, operation: string): FollowError {
    console.error(`${operation} error:`, error);

    if (error && typeof error === 'object' && 'error' in error && 'message' in error) {
      return error as FollowError;
    }

    return {
      error: "Network error",
      message: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }

  static async followUser(userId: number): Promise<FollowResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/follow`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        credentials: "include",
      });

      return await this.handleResponse<FollowResponse>(response);
    } catch (error) {
      throw this.handleCatchError(error, "Follow user");
    }
  }

  static async unfollowUser(userId: number): Promise<FollowResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/unfollow`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
        credentials: "include",
      });

      return await this.handleResponse<FollowResponse>(response);
    } catch (error) {
      throw this.handleCatchError(error, "Unfollow user");
    }
  }

  static async getFollowStatus(userId: number): Promise<FollowResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/follow-status`, {
        method: "GET",
        headers: this.getAuthHeaders(),
        credentials: "include",
      });

      return await this.handleResponse<FollowResponse>(response);
    } catch (error) {
      throw this.handleCatchError(error, "Get follow status");
    }
  }

  static async getFollowers(
    userId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<FollowersListResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(
        `${API_BASE_URL}/api/users/${userId}/followers?${params}`,
        {
          method: "GET",
          headers: this.getAuthHeaders(),
          credentials: "include",
        }
      );

      return await this.handleResponse<FollowersListResponse>(response);
    } catch (error) {
      throw this.handleCatchError(error, "Get followers");
    }
  }

  static async getFollowing(
    userId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<FollowingListResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(
        `${API_BASE_URL}/api/users/${userId}/following?${params}`,
        {
          method: "GET",
          headers: this.getAuthHeaders(),
          credentials: "include",
        }
      );

      return await this.handleResponse<FollowingListResponse>(response);
    } catch (error) {
      throw this.handleCatchError(error, "Get following");
    }
  }

  static async getFollowStats(userId: number): Promise<FollowStatsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/follow-stats`, {
        method: "GET",
        headers: this.getAuthHeaders(),
        credentials: "include",
      });

      return await this.handleResponse<FollowStatsResponse>(response);
    } catch (error) {
      throw this.handleCatchError(error, "Get follow stats");
    }
  }
}
