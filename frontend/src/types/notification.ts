export type NotificationType =
  | "invite"
  | "follow"
  | "message"
  | "system";

export interface NotificationPayload {
  title?: string;
  body?: string;
  target_type?: "post" | "activity" | "user" | "system";
  target_id?: string;
}

export interface Notification {
  id: number;
  user_id: number;
  actor_id?: number | null;
  type: NotificationType;
  payload: NotificationPayload;
  read: boolean;
  created_at: string;
}
