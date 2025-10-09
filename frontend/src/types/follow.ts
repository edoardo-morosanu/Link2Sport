export interface FollowResponse {
  success: boolean;
  message: string;
  is_following: boolean;
}

export interface FollowStatsResponse {
  followers_count: number;
  following_count: number;
}

export interface FollowerUser {
  id: number;
  username: string;
  display_name: string;
  avatar_url: string;
  has_avatar: boolean;
  is_following: boolean;
  followed_at: string;
}

export interface FollowingUser {
  id: number;
  username: string;
  display_name: string;
  avatar_url: string;
  has_avatar: boolean;
  follows_back: boolean;
  followed_at: string;
}

export interface FollowListResponse<T> {
  users: T[];
  total_count: number;
  page: number;
  per_page: number;
  has_next: boolean;
}

export interface FollowersListResponse extends FollowListResponse<FollowerUser> {}
export interface FollowingListResponse extends FollowListResponse<FollowingUser> {}

export interface FollowError {
  error: string;
  message: string;
}

export interface FollowHookState {
  loading: boolean;
  error: FollowError | null;
}

export interface PaginatedFollowState<T> extends FollowHookState {
  users: T[];
  hasNext: boolean;
  currentPage: number;
  totalCount: number;
}

export interface FollowButtonProps {
  userId: number;
  initialFollowStatus?: boolean | null;
  onFollowChange?: (isFollowing: boolean) => void;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  className?: string;
}

export interface FollowListProps {
  userId: number;
  isVisible?: boolean;
  onUserClick?: (user: FollowerUser | FollowingUser) => void;
  showFollowButtons?: boolean;
  className?: string;
}
