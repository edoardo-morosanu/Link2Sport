package models

import (
	"backend/src/types"
	"time"

	"gorm.io/gorm"
)

type Post struct {
	ID        uint             `json:"id" gorm:"primaryKey"`
	UserID    uint             `json:"user_id" gorm:"not null"`
	Title     string           `json:"title" gorm:"not null;size:255"`
	Body      string           `json:"body" gorm:"not null;size:255"`
	Status    types.PostStatus `json:"status" gorm:"default:public;size:50"`
	CreatedAt time.Time        `json:"created_at"`
	UpdatedAt time.Time        `json:"updated_at"`
	DeletedAt gorm.DeletedAt   `json:"deleted_at" gorm:"index"`
}
