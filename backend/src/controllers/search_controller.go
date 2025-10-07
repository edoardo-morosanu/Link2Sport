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
	var req types.SearchUsersRequest

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "User not authenticated",
		})
		return
	}

	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	if len(strings.TrimSpace(req.Query)) < 2 {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid query",
			Message: "Search Query must be at least 2 characters long",
		})
		return
	}

	if req.Limit <= 0 || req.Limit > 50 {
		req.Limit = 10
	}
	if req.Offset < 0 {
		req.Offset = 0
	}

	var users []models.User
	var total int64

	query := config.DB.Model(&models.User{}).Preload("Sports")

	searchTerm := "%" + strings.ToLower(req.Query) + "%"

	query = config.DB.Model(&models.User{}).Where(
		"(LOWER(username) LIKE ? OR LOWER(display_name) LIKE ?) AND id != ?",
		searchTerm, searchTerm, userID,
	)

	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Database error",
			Message: "Failed to search users",
		})
		return
	}

	if err := query.Limit(req.Limit).Offset(req.Offset).Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Database error",
			Message: "Failed to search users",
		})
		return
	}

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

	response := types.SearchUsersResponse{
		Users:   userResults,
		Total:   total,
		HasMore: int64(req.Offset+req.Limit) < total,
	}

	c.JSON(http.StatusOK, response)
}
