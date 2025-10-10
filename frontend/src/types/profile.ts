// Import Event types for better integration
import { Event, EventType } from "./event";

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  email: string;
  bio?: string;
  location?: string;
  followersCount: number;
  followingCount: number;
  activitiesCount: number;
  profilePicture?: string;
  avatarUrl?: string;
  hasAvatar?: boolean;
  sports: string[];
}

export interface ProfilePost {
  id: string;
  userId: string;
  content: string;
  timestamp: Date;
  images?: string[];
  likes?: number;
  comments?: number;
}

// Keep ProfileActivity for backward compatibility, but now extends Event structure
export interface ProfileActivity {
  id: string;
  userId: string;
  type: "game" | "event" | "training";
  sport: string;
  title: string;
  description?: string;
  date: Date;
  location: string;
  participants?: number;
}

// Helper function to convert Event to ProfileActivity for legacy compatibility
export function eventToProfileActivity(event: Event): ProfileActivity {
  return {
    id: event.id,
    userId: event.organizer_id,
    type: event.type,
    sport: event.sport,
    title: event.title,
    description: event.description,
    date: event.start_at,
    location: event.location_name,
    participants: event.participants,
  };
}
