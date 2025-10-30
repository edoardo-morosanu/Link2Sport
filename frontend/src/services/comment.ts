import { AuthService } from "./auth";
import type { CommentNode, CreateCommentData } from "@/types/comment";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export class CommentService {
  private static validateAuthentication(): string {
    const token = AuthService.getToken();
    if (!token) {
      throw new Error("No authentication token found");
    }
    return token;
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

  private static mapNode(data: any): CommentNode {
    return {
      id: data.id?.toString() || "",
      post_id: data.post_id?.toString() || "",
      user_id: data.user_id?.toString() || "",
      parent_id: data.parent_id != null ? data.parent_id.toString() : undefined,
      body: data.body || "",
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      author_username: data.author_username,
      author_display_name: data.author_display_name,
      children: Array.isArray(data.children) ? data.children.map((c: any) => this.mapNode(c)) : [],
    };
  }

  static async getByPost(postId: string): Promise<CommentNode[]> {
    const token = this.validateAuthentication();
    const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    });
    const data = await this.handleResponse(res);
    if (!Array.isArray(data)) return [];
    return data.map((n: any) => this.mapNode(n));
  }

  static async create(postId: string, payload: CreateCommentData): Promise<CommentNode> {
    const normalized: any = { body: payload.body };
    if (payload.parent_id != null) {
      const num = typeof payload.parent_id === "string" ? parseInt(payload.parent_id, 10) : payload.parent_id;
      if (!Number.isNaN(num as number)) normalized.parent_id = num as number;
    }
    const token = this.validateAuthentication();
    const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(normalized),
      credentials: "include",
    });
    const data = await this.handleResponse(res);
    return this.mapNode(data);
  }

  static async delete(postId: string, commentId: string): Promise<void> {
    const token = this.validateAuthentication();
    const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments/${commentId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    });
    await this.handleResponse(res);
  }
}
