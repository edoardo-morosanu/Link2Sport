package models

import (
	"time"
)

type Follow struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	FollowerID uint      `json:"follower_id" gorm:"not null"`
	FollowedID uint      `json:"followed_id" gorm:"not null"`
	Follower   User      `json:"follower" gorm:"foreignKey:FollowerID"`
	Followed   User      `json:"followed" gorm:"foreignKey:FollowedID"`
	CreatedAt  time.Time `json:"created_at"`
}
