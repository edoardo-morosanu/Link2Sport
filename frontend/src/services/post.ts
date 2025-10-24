import { AuthService } from "./auth";
import { Post, CreatePostData, UpdatePostData } from "@/types/post";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export class PostService {
  private static validateAuthentication(): string {
    const token = AuthService.getToken();
    if (!token) {
      throw new Error("No authentication token found");
    }
    return token;
  }

  private static createJsonHeaders(token: string): HeadersInit {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  private static async handleResponse(response: Response): Promise<any> {
    if (!response.ok) {
      if (response.status === 401) {
        AuthService.logout();
        throw new Error("Authentication expired. Please login again.");
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    if (response.status === 204) return null;
    return await response.json();
  }

  private static async makeRequest(url: string, options: RequestInit): Promise<any> {
    const token = this.validateAuthentication();
    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    };
    const response = await fetch(url, requestOptions);
    return this.handleResponse(response);
  }

  private static mapPostResponse(data: any): Post {
    return {
      id: data.id?.toString() || "",
      user_id: data.user_id?.toString() || "",
      title: data.title || "",
      body: data.body || "",
      status: data.status,
      image_url: data.image_url ? `${API_BASE_URL}${data.image_url}` : undefined,
      mentions: data.mentions || [],
      likes_count: typeof data.likes_count === "number" ? data.likes_count : 0,
      liked_by_me: !!data.liked_by_me,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
    };
  }

  static async createPost(payload: CreatePostData): Promise<Post> {
    const response = await this.makeRequest(`${API_BASE_URL}/api/posts/`, {
      method: "POST",
      headers: this.createJsonHeaders(this.validateAuthentication()),
      body: JSON.stringify(payload),
    });
    return this.mapPostResponse(response);
  }

  static async uploadPostImage(postId: string, file: File): Promise<string> {
    const token = this.validateAuthentication();
    const form = new FormData();
    form.append("image", file);
    const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
      credentials: "include",
    });
    const data = await this.handleResponse(response);
    return data?.image_url ? `${API_BASE_URL}${data.image_url}` : `${API_BASE_URL}/api/posts/${postId}/image`;
  }

  static async getPosts(limit = 20, offset = 0): Promise<Post[]> {
    const response = await this.makeRequest(
      `${API_BASE_URL}/api/posts/?limit=${limit}&offset=${offset}`,
      { method: "GET" },
    );
    if (!Array.isArray(response)) return [];
    return response.map((p: any) => this.mapPostResponse(p));
  }

  static async getMyPosts(): Promise<Post[]> {
    const response = await this.makeRequest(`${API_BASE_URL}/api/posts/my`, {
      method: "GET",
    });
    if (!Array.isArray(response)) return [];
    return response.map((p: any) => this.mapPostResponse(p));
  }

  static async getUserPostsById(userId: string): Promise<Post[]> {
    const response = await this.makeRequest(`${API_BASE_URL}/api/posts/user/${userId}`, {
      method: "GET",
    });
    if (!Array.isArray(response)) return [];
    return response.map((p: any) => this.mapPostResponse(p));
  }

  static async getPost(postId: string): Promise<Post> {
    const response = await this.makeRequest(`${API_BASE_URL}/api/posts/${postId}`, {
      method: "GET",
    });
    return this.mapPostResponse(response);
  }

  static async updatePost(postId: string, payload: UpdatePostData): Promise<Post> {
    const response = await this.makeRequest(`${API_BASE_URL}/api/posts/${postId}`, {
      method: "PUT",
      headers: this.createJsonHeaders(this.validateAuthentication()),
      body: JSON.stringify(payload),
    });
    return this.mapPostResponse(response);
  }

  static async deletePost(postId: string): Promise<void> {
    await this.makeRequest(`${API_BASE_URL}/api/posts/${postId}`, {
      method: "DELETE",
    });
  }

  static async toggleLike(postId: string): Promise<{ likes_count: number; liked_by_me: boolean }> {
    const res = await this.makeRequest(`${API_BASE_URL}/api/posts/${postId}/like`, {
      method: "POST",
    });
    return {
      likes_count: typeof res.likes_count === "number" ? res.likes_count : 0,
      liked_by_me: !!res.liked_by_me,
    };
  }
}
