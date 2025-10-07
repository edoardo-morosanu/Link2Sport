package types

import "time"

// ProfileResponse represents the response for profile operations
type ProfileResponse struct {
	ID          uint      `json:"id"`
	Username    string    `json:"username"`
	Email       string    `json:"email"`
	DisplayName string    `json:"display_name"`
	Bio         string    `json:"bio"`
	City        string    `json:"city"`
	Country     string    `json:"country"`
	Sports      []string  `json:"sports"`
	AvatarURL   string    `json:"avatar_url"`
	HasAvatar   bool      `json:"has_avatar"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// ProfileUpdateRequest represents the request for updating profile
type ProfileUpdateRequest struct {
	DisplayName string   `json:"display_name"`
	Bio         string   `json:"bio"`
	City        string   `json:"city"`
	Country     string   `json:"country"`
	Sports      []string `json:"sports"`
}
