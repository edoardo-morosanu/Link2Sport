package types

import "time"

// ProfileResponse represents the response for profile operations
// @Description User profile response payload (authenticated user's own profile)
type ProfileResponse struct {
	ID          uint      `json:"id" example:"12345" description:"User's unique identifier"`
	Username    string    `json:"username" example:"johndoe" description:"User's unique username"`
	Email       string    `json:"email" example:"user@example.com" description:"User's email address"`
	DisplayName string    `json:"display_name" example:"John Doe" description:"User's display name"`
	Bio         string    `json:"bio" example:"I love playing sports and meeting new people!" description:"User's biography"`
	City        string    `json:"city" example:"New York" description:"User's city"`
	Country     string    `json:"country" example:"USA" description:"User's country"`
	Sports      []string  `json:"sports" example:"[\"football\",\"basketball\"]" description:"List of sports user is interested in"`
	AvatarURL   string    `json:"avatar_url" example:"/api/user/12345/avatar" description:"URL to user's avatar image"`
	HasAvatar   bool      `json:"has_avatar" example:"true" description:"Whether user has uploaded an avatar"`
	CreatedAt   time.Time `json:"created_at" example:"2024-01-15T10:30:00Z" description:"Account creation timestamp"`
	UpdatedAt   time.Time `json:"updated_at" example:"2024-01-20T14:45:00Z" description:"Last profile update timestamp"`
}

// ProfileUpdateRequest represents the request for updating profile
// @Description Profile update request payload
type ProfileUpdateRequest struct {
	DisplayName string   `json:"display_name" example:"John Doe" description:"Updated display name"`
	Bio         string   `json:"bio" example:"I love playing sports and meeting new people!" description:"Updated biography"`
	City        string   `json:"city" example:"New York" description:"Updated city"`
	Country     string   `json:"country" example:"USA" description:"Updated country"`
	Sports      []string `json:"sports" example:"[\"football\",\"basketball\"]" description:"Updated list of sports interests"`
}

// PublicProfileResponse represents the response for public profile operations (other users' profiles)
// @Description Public profile response payload (other users' profiles)
type PublicProfileResponse struct {
	ID          uint      `json:"id" example:"12345" description:"User's unique identifier"`
	Username    string    `json:"username" example:"johndoe" description:"User's unique username"`
	DisplayName string    `json:"display_name" example:"John Doe" description:"User's display name"`
	Bio         string    `json:"bio" example:"I love playing sports and meeting new people!" description:"User's biography"`
	City        string    `json:"city" example:"New York" description:"User's city"`
	Country     string    `json:"country" example:"USA" description:"User's country"`
	Sports      []string  `json:"sports" example:"[\"football\",\"basketball\"]" description:"List of sports user is interested in"`
	AvatarURL   string    `json:"avatar_url" example:"/api/user/12345/avatar" description:"URL to user's avatar image"`
	HasAvatar   bool      `json:"has_avatar" example:"true" description:"Whether user has uploaded an avatar"`
	CreatedAt   time.Time `json:"created_at" example:"2024-01-15T10:30:00Z" description:"Account creation timestamp"`
	UpdatedAt   time.Time `json:"updated_at" example:"2024-01-20T14:45:00Z" description:"Last profile update timestamp"`
	IsFollowing bool      `json:"is_following" example:"false" description:"Whether current user is following this user"`
}
