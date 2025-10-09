package types

import "time"

// FollowResponse represents the response after a follow/unfollow action
// @Description Follow action response payload
type FollowResponse struct {
	Success     bool   `json:"success" example:"true" description:"Whether the action was successful"`
	Message     string `json:"message" example:"Successfully followed user" description:"Response message"`
	IsFollowing bool   `json:"is_following" example:"true" description:"Current following status"`
}

// FollowStatsResponse represents follow statistics for a user
// @Description User follow statistics
type FollowStatsResponse struct {
	FollowersCount int `json:"followers_count" example:"42" description:"Number of followers"`
	FollowingCount int `json:"following_count" example:"15" description:"Number of users being followed"`
}

// FollowerResponse represents a follower in the followers list
// @Description Follower information in followers list
type FollowerResponse struct {
	ID          uint      `json:"id" example:"12345" description:"User's unique identifier"`
	Username    string    `json:"username" example:"johndoe" description:"User's username"`
	DisplayName string    `json:"display_name" example:"John Doe" description:"User's display name"`
	AvatarURL   string    `json:"avatar_url" example:"/api/user/12345/avatar" description:"URL to user's avatar"`
	HasAvatar   bool      `json:"has_avatar" example:"true" description:"Whether user has an avatar"`
	IsFollowing bool      `json:"is_following" example:"false" description:"Whether current user follows this user back"`
	FollowedAt  time.Time `json:"followed_at" example:"2024-01-15T10:30:00Z" description:"When the follow relationship was created"`
}

// FollowingResponse represents a user in the following list
// @Description Following information in following list
type FollowingResponse struct {
	ID          uint      `json:"id" example:"12345" description:"User's unique identifier"`
	Username    string    `json:"username" example:"johndoe" description:"User's username"`
	DisplayName string    `json:"display_name" example:"John Doe" description:"User's display name"`
	AvatarURL   string    `json:"avatar_url" example:"/api/user/12345/avatar" description:"URL to user's avatar"`
	HasAvatar   bool      `json:"has_avatar" example:"true" description:"Whether user has an avatar"`
	FollowsBack bool      `json:"follows_back" example:"true" description:"Whether this user follows current user back"`
	FollowedAt  time.Time `json:"followed_at" example:"2024-01-15T10:30:00Z" description:"When the follow relationship was created"`
}

// FollowListResponse represents a paginated list of followers/following
// @Description Paginated follow list response
type FollowListResponse struct {
	Users      interface{} `json:"users" description:"List of users (FollowerResponse or FollowingResponse)"`
	TotalCount int         `json:"total_count" example:"100" description:"Total number of users"`
	Page       int         `json:"page" example:"1" description:"Current page number"`
	PerPage    int         `json:"per_page" example:"20" description:"Items per page"`
	HasNext    bool        `json:"has_next" example:"true" description:"Whether there are more pages"`
}
