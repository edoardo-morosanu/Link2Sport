package types

// SearchUsersRequest represents the request for searching users
type SearchUsersRequest struct {
	Query  string `form:"q" binding:"required,min=2"`
	Limit  int    `form:"limit,default=10"`
	Offset int    `form:"offset,default=0"`
}

// SearchUserResult represents a single user in search results
type SearchUserResult struct {
	ID          uint   `json:"id"`
	Username    string `json:"username"`
	DisplayName string `json:"display_name"`
	AvatarURL   string `json:"avatar_url"`
	HasAvatar   bool   `json:"has_avatar"`
}

// SearchUsersResponse represents the response for user search
type SearchUsersResponse struct {
	Users   []SearchUserResult `json:"users"`
	Total   int64              `json:"total"`
	HasMore bool               `json:"has_more"`
}
