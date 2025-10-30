export interface CommentNode {
  id: string;
  post_id: string;
  user_id: string;
  parent_id?: string | null;
  body: string;
  created_at: Date;
  updated_at: Date;
  author_username?: string;
  author_display_name?: string;
  children?: CommentNode[];
}

export interface CreateCommentData {
  body: string;
  parent_id?: string | null;
}
