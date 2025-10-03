package models

import (
	"time"

	"gorm.io/gorm"
)

/*
 * The way this works with gorm is interesting.
 * The Sports and Users relate to each other now not as a field in the users table,
 * but by using a junction table between the two.
 */
type User struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	Username     string         `json:"username" gorm:"unique;not null;size:100"`
	Email        string         `json:"email" gorm:"unique;not null;size:255"`
	PasswordHash string         `json:"-" gorm:"not null;size:255"`
	DisplayName  string         `json:"display_name" gorm:"size:150"`
	DateOfBirth  *time.Time     `json:"date_of_birth" gorm:"type:date"`
	Bio          string         `json:"bio" gorm:"type:text"`
	City         string         `json:"city" gorm:"size:100"`
	Country      string         `json:"country" gorm:"size:100"`
	AvatarData   []byte         `json:"-" gorm:"type:bytea"`
	AvatarType   string         `json:"avatar_type" gorm:"size:50"`
	Sports       []Sport        `json:"sports" gorm:"many2many:user_sports;"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}
