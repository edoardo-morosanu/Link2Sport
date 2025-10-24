export interface Post {
  id: string;
  user_id: string;
  title: string;
  body: string;
  status: "published" | "archived" | "deleted";
  image_url?: string;
  mentions?: string[];
  likes_count?: number;
  liked_by_me?: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreatePostData {
  title: string;
  body: string;
  mentions?: string[];
}

export interface UpdatePostData {
  title?: string;
  body?: string;
  mentions?: string[];
}
