package controllers

import (
	"backend/src/config"
	"backend/src/models"
	"backend/src/types"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type SearchController struct{}

func NewSearchController() *SearchController {
	return &SearchController{}
}

func (sc *SearchController) SearchUsers(c *gin.Context) {
	userID, ok := sc.validateSearchAuthentication(c)
	if !ok {
		return
	}

	req, ok := sc.validateSearchRequest(c)
	if !ok {
		return
	}

	sc.normalizePaginationParams(&req)

	users, total, ok := sc.executeUserSearch(c, req, userID)
	if !ok {
		return
	}

	userResults := sc.transformSearchResults(users)
	response := sc.buildSearchResponse(userResults, total, req)

	c.JSON(http.StatusOK, response)
}

// validateSearchAuthentication validates user authentication for search
func (sc *SearchController) validateSearchAuthentication(c *gin.Context) (interface{}, bool) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "User not authenticated",
		})
		return nil, false
	}
	return userID, true
}

// validateSearchRequest validates and binds the search request
func (sc *SearchController) validateSearchRequest(c *gin.Context) (types.SearchUsersRequest, bool) {
	var req types.SearchUsersRequest

	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return req, false
	}

	if len(strings.TrimSpace(req.Query)) < 2 {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid query",
			Message: "Search Query must be at least 2 characters long",
		})
		return req, false
	}

	return req, true
}

// normalizePaginationParams normalizes pagination parameters
func (sc *SearchController) normalizePaginationParams(req *types.SearchUsersRequest) {
	if req.Limit <= 0 || req.Limit > 50 {
		req.Limit = 10
	}
	if req.Offset < 0 {
		req.Offset = 0
	}
}

// executeUserSearch executes the database search operations
func (sc *SearchController) executeUserSearch(c *gin.Context, req types.SearchUsersRequest, userID interface{}) ([]models.User, int64, bool) {
	var users []models.User
	var total int64

	searchTerm := "%" + strings.ToLower(req.Query) + "%"

	query := config.DB.Model(&models.User{}).Where(
		"(LOWER(username) LIKE ? OR LOWER(display_name) LIKE ?) AND id != ?",
		searchTerm, searchTerm, userID,
	)

	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Database error",
			Message: "Failed to search users",
		})
		return nil, 0, false
	}

	if err := query.Limit(req.Limit).Offset(req.Offset).Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Database error",
			Message: "Failed to search users",
		})
		return nil, 0, false
	}

	return users, total, true
}

// transformSearchResults transforms user models to search results
func (sc *SearchController) transformSearchResults(users []models.User) []types.SearchUserResult {
	userResults := make([]types.SearchUserResult, len(users))
	for i, user := range users {
		userResults[i] = types.SearchUserResult{
			ID:          user.ID,
			Username:    user.Username,
			DisplayName: user.DisplayName,
			AvatarURL:   fmt.Sprintf("/api/user/%d/avatar", user.ID),
			HasAvatar:   len(user.AvatarData) > 0,
		}
	}
	return userResults
}

// buildSearchResponse builds the final search response
func (sc *SearchController) buildSearchResponse(userResults []types.SearchUserResult, total int64, req types.SearchUsersRequest) types.SearchUsersResponse {
	return types.SearchUsersResponse{
		Users:   userResults,
		Total:   total,
		HasMore: int64(req.Offset+req.Limit) < total,
	}
}
