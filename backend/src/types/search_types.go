package types

// SearchUsersRequest represents the request for searching users
// @Description User search request parameters
type SearchUsersRequest struct {
	Query  string `form:"q" binding:"required,min=2" example:"john" description:"Search query (minimum 2 characters)"`
	Limit  int    `form:"limit,default=10" example:"10" description:"Number of results per page (1-50)"`
	Offset int    `form:"offset,default=0" example:"0" description:"Number of results to skip"`
}

// SearchUserResult represents a single user in search results
// @Description Individual user search result
type SearchUserResult struct {
	ID          uint   `json:"id" example:"12345" description:"User's unique identifier"`
	Username    string `json:"username" example:"johndoe" description:"User's unique username"`
	DisplayName string `json:"display_name" example:"John Doe" description:"User's display name"`
	AvatarURL   string `json:"avatar_url" example:"/api/user/12345/avatar" description:"URL to user's avatar image"`
	HasAvatar   bool   `json:"has_avatar" example:"true" description:"Whether user has uploaded an avatar"`
}

// SearchUsersResponse represents the response for user search
// @Description User search response with pagination
type SearchUsersResponse struct {
	Users   []SearchUserResult `json:"users" description:"List of matching users"`
	Total   int64              `json:"total" example:"25" description:"Total number of matching users"`
	HasMore bool               `json:"has_more" example:"true" description:"Whether there are more results available"`
}
