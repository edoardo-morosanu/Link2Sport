package types

import "time"

// CreateCommentRequest represents creating a comment (root or reply)
type CreateCommentRequest struct {
	Body     string `json:"body" validate:"required,min=1,max=500"`
	ParentID *uint  `json:"parent_id,omitempty"`
}

// CommentResponse represents a comment with optional nested children
type CommentResponse struct {
	ID        uint               `json:"id"`
	PostID    uint               `json:"post_id"`
	UserID    uint               `json:"user_id"`
	ParentID  *uint              `json:"parent_id,omitempty"`
	Body      string             `json:"body"`
	CreatedAt time.Time          `json:"created_at"`
	UpdatedAt time.Time          `json:"updated_at"`

	AuthorUsername   string      `json:"author_username"`
	AuthorDisplayName string     `json:"author_display_name"`

	Children []CommentResponse   `json:"children,omitempty"`
}
