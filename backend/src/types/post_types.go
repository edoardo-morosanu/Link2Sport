package types

import "time"

// CreatePostRequest represents the request for creating a post
// @Description Event creation request payload
type CreatePostRequest struct {
	Title string `json:"title" validate:"required" example:"Game" description:"Title of post"`
	Body  string `json:"body" validate:"required,min=5,max=255" example:"Had fun" description:"Body text of post"`
	Mentions []string `json:"mentions,omitempty" description:"Optional list of mentioned usernames (e.g. [\"alice\", \"bob\"])"`
}

// UpdatePostRequest represents the request for updating a post
// @Description Post update request payload
type UpdatePostRequest struct {
	Title *string `json:"title" validate:"required" example:"Game" description:"Title of post"`
	Body  *string `json:"body" validate:"required,min=5,max=255" example:"Had fun" description:"Body text of post"`
	Mentions *[]string `json:"mentions,omitempty" description:"Optional list of mentioned usernames (e.g. [\"alice\", \"bob\"])"`
}

// PostResponse represents the response for post operations
// @Description Post response payload
type PostResponse struct {
	ID        uint       `json:"id" example:"1" description:"Post unique identifier"`
	UserID    uint       `json:"user_id" example:"12345" description:"Post publisher ID"`
	Title     string     `json:"title" example:"Game" description:"Title of post"`
	Body      string     `json:"body" example:"Had fun" description:"Body text of post"`
	Status    PostStatus `json:"status" example:"archived" description:"Status of the post"`
	ImageURL  *string    `json:"image_url,omitempty" description:"URL to the post image if available"`
	Mentions  []string   `json:"mentions,omitempty" description:"Usernames mentioned in the post"`
	LikesCount int       `json:"likes_count" description:"Total number of likes on the post"`
	LikedByMe  bool      `json:"liked_by_me" description:"Whether the requesting user liked this post"`
	CreatedAt time.Time  `json:"created_at" example:"2024-01-15T10:30:00Z" description:"Creation timestamp"`
	UpdatedAt time.Time  `json:"updated_at" example:"2024-01-15T10:30:00Z" description:"Last update timestamp"`
}

// PostWithAuthorResponse extends PostResponse with author details
type PostWithAuthorResponse struct {
	PostResponse
	AuthorName     string  `json:"author_name"`
	AuthorUsername string  `json:"author_username"`
	AuthorAvatar   *string `json:"author_avatar,omitempty"`
	IsAuthor       bool    `json:"is_author"`
}
