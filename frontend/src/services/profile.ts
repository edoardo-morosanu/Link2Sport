import { AuthService } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export class ProfileService {
  private static validateAuthentication(): string {
    const token = AuthService.getToken();
    if (!token) {
      throw new Error("No authentication token found");
    }
    return token;
  }

  private static createHeaders(token: string): HeadersInit {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  private static async handleResponse(response: Response): Promise<unknown> {
    if (!response.ok) {
      if (response.status === 401) {
        AuthService.logout();
        throw new Error("Authentication expired. Please login again.");
      }
      throw new Error(`Request failed with status ${response.status}`);
    }
    return await response.json();
  }

  private static async makeAuthenticatedRequest(
    url: string,
    options: RequestInit,
  ): Promise<unknown> {
    const token = this.validateAuthentication();

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...this.createHeaders(token),
        ...options.headers,
      },
      credentials: "include",
    };

    try {
      const response = await fetch(url, requestOptions);
      return await this.handleResponse(response);
    } catch (error) {
      console.error("API request error:", error);
      throw error;
    }
  }
  static async getProfile() {
    const response = (await this.makeAuthenticatedRequest(
      `${API_BASE_URL}/api/profile`,
      {
        method: "GET",
      },
    )) as any;

    // Map backend response to frontend types
    return {
      id: response.id?.toString() || "",
      username: response.username || "",
      name: response.display_name || response.username || "",
      email: response.email || "",
      bio: response.bio || "",
      location: response.city
        ? `${response.city}${response.country ? `, ${response.country}` : ""}`
        : "",
      followersCount: response.followers_count || 0,
      followingCount: response.following_count || 0,
      activitiesCount: 0, // This would come from a separate API call
      profilePicture: response.avatar_url || "",
      avatarUrl: response.avatar_url
        ? `${API_BASE_URL}${response.avatar_url}`
        : "",
      hasAvatar: response.has_avatar || false,
      sports: response.sports || [],
    };
  }

  static async updateProfile(profileData: unknown) {
    return await this.makeAuthenticatedRequest(`${API_BASE_URL}/api/profile`, {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  }
}
