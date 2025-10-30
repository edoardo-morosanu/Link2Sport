import { AuthService } from "./auth";
import { Notification } from "@/types/notification";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

async function authed<T>(path: string, init?: RequestInit): Promise<T> {
  const token = AuthService.getToken();
  if (!token) throw new Error("No authentication token found");
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
    credentials: "include",
  });
  if (!res.ok) {
    if (res.status === 401) {
      AuthService.logout();
      throw new Error("Authentication expired. Please login again.");
    }
    throw new Error(`Request failed with status ${res.status}`);
  }
  if (res.status === 204) return undefined as any;
  return (await res.json()) as T;
}

export const NotificationService = {
  async list(unreadOnly?: boolean): Promise<Notification[]> {
    const qp = unreadOnly ? "?unread_only=true" : "";
    return await authed<Notification[]>(`/api/notifications${qp}`);
  },
  async markRead(id: number): Promise<void> {
    await authed<void>(`/api/notifications/${id}`, { method: "PATCH" });
  },
  async markAllRead(): Promise<void> {
    await authed<void>(`/api/notifications/mark-all-read`, { method: "POST" });
  },
};
