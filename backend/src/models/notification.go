package models

import (
	"time"

	"backend/src/types"

	"gorm.io/gorm"
)

type Notification struct {
	ID        uint                   `json:"id" gorm:"primaryKey"`
	UserID    uint                   `json:"user_id" gorm:"not null"`
	ActorID   *uint                  `json:"actor_id"`
	Type      types.NotificationType `json:"type" gorm:"type:text"`
	Payload   types.JSON             `json:"payload" gorm:"type:jsonb"`
	Read      bool                   `json:"read" gorm:"default:false"`
	User      User                   `json:"user" gorm:"foreignKey:UserID"`
	Actor     *User                  `json:"actor" gorm:"foreignKey:ActorID"`
	CreatedAt time.Time              `json:"created_at"`
	UpdatedAt time.Time              `json:"updated_at"`
	DeletedAt gorm.DeletedAt         `json:"deleted_at" gorm:"index"`
}
