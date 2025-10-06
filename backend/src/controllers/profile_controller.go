package controllers

import (
	"backend/src/config"
	"backend/src/models"
	"backend/src/types"
	"fmt"
	"net/http"

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
