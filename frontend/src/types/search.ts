export interface SearchUser {
  id: number;
  username: string;
  display_name: string;
  avatar_url: string;
  has_avatar: boolean;
}

export interface SearchUsersResponse {
  users: SearchUser[];
  total: number;
  has_more: boolean;
}

export interface SearchRequest {
  q: string;
  limit?: number;
  offset?: number;
}

// For the user profile page
export interface PublicUserProfile {
  id: number;
  username: string;
  display_name: string;
  bio: string;
  city: string;
  country: string;
  sports: string[];
  avatar_url: string;
  has_avatar: boolean;
  created_at: string;
  updated_at: string;
  is_following?: boolean; // Will be added when I implement follow functionality
  followers_count: number;
  following_count: number;
}
