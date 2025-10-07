package controllers

import (
	"backend/src/config"
	"backend/src/models"
	"backend/src/types"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type ProfileController struct{}

func NewProfileController() *ProfileController {
	return &ProfileController{}
}

func (pc *ProfileController) GetProfile(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "User not authenticated",
		})
		return
	}

	var user models.User
	if err := config.DB.Preload("Sports").First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Error:   "User not found",
			Message: "Profile not found",
		})
		return
	}

	sports := make([]string, len(user.Sports))
	for i, sport := range user.Sports {
		sports[i] = sport.Name
	}

	// Check if user has avatar
	hasAvatar := len(user.AvatarData) > 0
	avatarURL := fmt.Sprintf("/api/user/%d/avatar", user.ID) // Always provide URL, will serve default if needed

	profile := types.ProfileResponse{
		ID:          user.ID,
		Username:    user.Username,
		Email:       user.Email,
		DisplayName: user.DisplayName,
		Bio:         user.Bio,
		City:        user.City,
		Country:     user.Country,
		Sports:      sports,
		AvatarURL:   avatarURL,
		HasAvatar:   hasAvatar,
		CreatedAt:   user.CreatedAt,
		UpdatedAt:   user.UpdatedAt,
	}

	c.JSON(http.StatusOK, profile)
}

func (pc *ProfileController) GetPublicProfile(c *gin.Context) {
	// Get the user ID from the URL parameter
	userIDParam := c.Param("id")
	targetUserID, err := strconv.ParseUint(userIDParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid user ID",
			Message: "User ID must be a valid number",
		})
		return
	}

	// Get current user ID from JWT token for follow status (optional)
	currentUserID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "User not authenticated",
		})
		return
	}

	// Prevent users from viewing their own profile through this endpoint
	if currentUserID == uint(targetUserID) {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Message: "Use /api/profile to view your own profile",
		})
		return
	}

	var user models.User
	if err := config.DB.Preload("Sports").First(&user, targetUserID).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Error:   "User not found",
			Message: "Profile not found",
		})
		return
	}

	sports := make([]string, len(user.Sports))
	for i, sport := range user.Sports {
		sports[i] = sport.Name
	}

	// Check if user has avatar
	hasAvatar := len(user.AvatarData) > 0
	avatarURL := fmt.Sprintf("/api/user/%d/avatar", user.ID)

	// TODO: Check if current user is following this user
	// This would require a follows table and relationship
	isFollowing := false

	profile := types.PublicProfileResponse{
		ID:          user.ID,
		Username:    user.Username,
		DisplayName: user.DisplayName,
		Bio:         user.Bio,
		City:        user.City,
		Country:     user.Country,
		Sports:      sports,
		AvatarURL:   avatarURL,
		HasAvatar:   hasAvatar,
		CreatedAt:   user.CreatedAt,
		UpdatedAt:   user.UpdatedAt,
		IsFollowing: isFollowing,
	}

	c.JSON(http.StatusOK, profile)
}

// func (pc *ProfileController) UpdateProfile(c *gin.Context) {
// 	user, exists := c.Get("user.ID")
// 	if !exists {
// 		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
// 			Error: "Unauthorized",
// 			Message: "User not authenticated",
// 		})
// 		return
// 	}

// 	c.JSON(http.StatusOK, gin.H{"message": "Profile update endpoint"})
// }
