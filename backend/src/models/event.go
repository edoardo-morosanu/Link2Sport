package models

import (
	"time"

	"gorm.io/gorm"
)

type Event struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	OrganizerID  uint           `json:"organizer_id" gorm:"not null"`
	Organizer    User           `json:"organizer" gorm:"foreignKey:OrganizerID"`
	Type         string         `json:"type" gorm:"not null;size:20;default:'event';check:type IN ('game','event','training')"` // ADD THIS LINE
	Title        string         `json:"title" gorm:"not null;size:255"`
	Description  string         `json:"description" gorm:"type:text"`
	Sport        string         `json:"sport" gorm:"size:100"`
	StartAt      time.Time      `json:"start_at" gorm:"type:timestamptz;not null"`
	EndAt        *time.Time     `json:"end_at" gorm:"type:timestamptz"`
	Capacity     *int           `json:"capacity"`
	LocationName string         `json:"location_name" gorm:"size:255"`
	Latitude     *float64       `json:"latitude" gorm:"not null"`
	Longitude    *float64       `json:"longitude" gorm:"not null"`
	Status       string         `json:"status" gorm:"not null;size:20;default:'upcoming';check:status IN ('upcoming','active','complete','cancelled')"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}
