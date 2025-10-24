package models

import "time"

// PostLike represents a user's like on a post
// There is a unique constraint on (post_id, user_id)
type PostLike struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	PostID    uint      `json:"post_id" gorm:"not null;index;uniqueIndex:idx_post_user"`
	UserID    uint      `json:"user_id" gorm:"not null;index;uniqueIndex:idx_post_user"`
	CreatedAt time.Time `json:"created_at"`
}
