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
