import { AuthService } from "./auth";
import type { CommentNode, CreateCommentData } from "@/types/comment";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export class ActivityCommentService {
  private static validateAuthentication(): string {
    const token = AuthService.getToken();
    if (!token) throw new Error("No authentication token found");
    return token;
  }

  private static async handleResponse(response: Response): Promise<any> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.message || `Request failed with status ${response.status}`;
      const err: any = new Error(message);
      (err.status = response.status);
      throw err;
    }
    if (response.status === 204) return null;
    return await response.json();
  }

  private static mapNode(data: any): CommentNode {
    return {
      id: data.id?.toString() || "",
      post_id: data.activity_id?.toString() || data.post_id?.toString() || "",
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

  static async getByActivity(activityId: string): Promise<CommentNode[]> {
    const token = this.validateAuthentication();
    // Prefer events route first to avoid 404 noise
    let res = await fetch(`${API_BASE_URL}/api/events/${activityId}/comments`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    });
    // Fallback to activities on 404
    if (res.status === 404) {
      res = await fetch(`${API_BASE_URL}/api/activities/${activityId}/comments`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
    }
    const data = await this.handleResponse(res);
    if (!Array.isArray(data)) return [];
    return data.map((n: any) => this.mapNode(n));
  }

  static async create(activityId: string, payload: CreateCommentData): Promise<CommentNode> {
    const normalized: any = { body: payload.body };
    if (payload.parent_id != null) {
      const num = typeof payload.parent_id === "string" ? parseInt(payload.parent_id, 10) : payload.parent_id;
      if (!Number.isNaN(num as number)) normalized.parent_id = num as number;
    }
    const token = this.validateAuthentication();
    let res = await fetch(`${API_BASE_URL}/api/events/${activityId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(normalized),
      credentials: "include",
    });
    if (res.status === 404) {
      res = await fetch(`${API_BASE_URL}/api/activities/${activityId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(normalized),
        credentials: "include",
      });
    }
    const data = await this.handleResponse(res);
    return this.mapNode(data);
  }

  static async delete(activityId: string, commentId: string): Promise<void> {
    const token = this.validateAuthentication();
    let res = await fetch(`${API_BASE_URL}/api/events/${activityId}/comments/${commentId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    });
    if (res.status === 404) {
      res = await fetch(`${API_BASE_URL}/api/activities/${activityId}/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
    }
    await this.handleResponse(res);
  }
}
