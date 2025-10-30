package models

import (
	"time"

	"gorm.io/gorm"
)

type Comment struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	PostID    uint           `json:"post_id" gorm:"not null;index"`
	UserID    uint           `json:"user_id" gorm:"not null;index"`
	ParentID  *uint          `json:"parent_id" gorm:"index"`
	Body      string         `json:"body" gorm:"not null;size:500"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at" gorm:"index"`

	Author User `json:"author" gorm:"foreignKey:UserID"`
}
