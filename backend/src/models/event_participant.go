package models

import (
	"time"
)

type EventParticipant struct {
	ID       uint      `json:"id" gorm:"primaryKey"`
	EventID  uint      `json:"event_id" gorm:"not null"`
	UserID   uint      `json:"user_id" gorm:"not null"`
	Role     string    `json:"role" gorm:"default:participant;size:50"`
	JoinedAt time.Time `json:"joined_at"`
	Event    Event     `json:"event" gorm:"foreignKey:EventID"`
	User     User      `json:"user" gorm:"foreignKey:UserID"`
}
