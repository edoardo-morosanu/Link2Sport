package models

import (
	"time"

	"gorm.io/gorm"
)

// PostMention links a post to a mentioned user
type PostMention struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	PostID    uint           `json:"post_id" gorm:"not null;index"`
	UserID    uint           `json:"user_id" gorm:"not null;index"`
	Post      Post           `json:"post" gorm:"foreignKey:PostID"`
	User      User           `json:"user" gorm:"foreignKey:UserID"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}
