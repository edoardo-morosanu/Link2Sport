export interface Event {
  id: string;
  organizer_id: string;
  type: EventType;
  title: string;
  description: string;
  sport: string;
  start_at: Date;
  end_at?: Date;
  location_name: string;
  latitude: number;
  longitude: number;
  capacity?: number;
  participants: number;
  status: EventStatus;
  created_at: Date;
  updated_at: Date;
}

export interface EventWithOrganizer extends Event {
  organizer_name: string;
  organizer_username: string;
  organizer_avatar?: string;
  is_organizer: boolean;
  is_participant: boolean;
}

export interface CreateEventData {
  type: EventType;
  title: string;
  description: string;
  sport: string;
  start_at: Date;
  end_at?: Date;
  location_name: string;
  latitude: number;
  longitude: number;
  capacity?: number;
}

export interface UpdateEventData {
  type?: EventType;
  title?: string;
  description?: string;
  sport?: string;
  start_at?: Date;
  end_at?: Date;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  capacity?: number;
}

export type EventType = "game" | "event" | "training";

export type EventStatus = "upcoming" | "active" | "complete" | "cancelled";

export interface EventFilters {
  sport?: string;
  type?: EventType;
  location?: string;
  scope?: "all" | "following";
  lat?: number;
  lng?: number;
  radius_km?: number;
  status?: string;
  start_after?: string;
  start_before?: string;
  min_capacity?: number;
  max_capacity?: number;
  limit?: number;
  offset?: number;
}

export interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  role: string;
  joined_at: Date;
  username: string;
  name: string;
  avatar?: string;
}
