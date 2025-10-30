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

// DeleteAccount soft-deletes the authenticated user's account
// @Summary      Delete my account (soft)
// @Description  Soft delete the authenticated user. Content may remain but the account is deactivated.
// @Tags         Profile
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      204 "No Content"
// @Failure      401 {object} types.ErrorResponse "User not authenticated"
// @Failure      404 {object} types.ErrorResponse "User not found"
// @Router       /profile [delete]
func (pc *ProfileController) DeleteAccount(c *gin.Context) {
    uid, exists := c.Get("userID")
    if !exists {
        c.JSON(http.StatusUnauthorized, types.ErrorResponse{Error: "Unauthorized", Message: "User not authenticated"})
        return
    }

    var user models.User
    if err := config.DB.First(&user, uid).Error; err != nil {
        c.JSON(http.StatusNotFound, types.ErrorResponse{Error: "User not found", Message: "Profile not found"})
        return
    }

    if err := config.DB.Delete(&user).Error; err != nil {
        c.JSON(http.StatusInternalServerError, types.ErrorResponse{Error: "Database error", Message: "Failed to delete account"})
        return
    }

    c.Status(http.StatusNoContent)
}

func NewProfileController() *ProfileController {
	return &ProfileController{}
}

// GetProfile godoc
// @Summary      Get current user's profile
// @Description  Retrieve the authenticated user's complete profile information including sports and avatar
// @Tags         Profile
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {object} types.ProfileResponse "User profile information"
// @Failure      401 {object} types.ErrorResponse "User not authenticated"
// @Failure      404 {object} types.ErrorResponse "Profile not found"
// @Router       /profile [get]
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

	// Get follower and following counts
	var followersCount, followingCount int64
	config.DB.Model(&models.Follow{}).Where("followed_id = ?", user.ID).Count(&followersCount)
	config.DB.Model(&models.Follow{}).Where("follower_id = ?", user.ID).Count(&followingCount)

	// Get activities (events) count for this user (exclude cancelled)
	var activitiesCount int64
	config.DB.Model(&models.Event{}).Where("organizer_id = ? AND deleted_at IS NULL AND status != ?", user.ID, "cancelled").Count(&activitiesCount)

	profile := types.ProfileResponse{
		ID:             user.ID,
		Username:       user.Username,
		Email:          user.Email,
		DisplayName:    user.DisplayName,
		Bio:            user.Bio,
		City:           user.City,
		Country:        user.Country,
		Sports:         sports,
		AvatarURL:      avatarURL,
		HasAvatar:      hasAvatar,
		FollowersCount: int(followersCount),
		FollowingCount: int(followingCount),
		ActivitiesCount: int(activitiesCount),
		CreatedAt:      user.CreatedAt,
		UpdatedAt:      user.UpdatedAt,
	}

	c.JSON(http.StatusOK, profile)
}

// GetPublicProfile godoc
// @Summary      Get public user profile
// @Description  Retrieve another user's public profile information by user ID
// @Tags         Profile
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "User ID" example(12345)
// @Success      200 {object} types.PublicProfileResponse "Public profile information"
// @Failure      400 {object} types.ErrorResponse "Invalid user ID or trying to access own profile"
// @Failure      401 {object} types.ErrorResponse "User not authenticated"
// @Failure      404 {object} types.ErrorResponse "Profile not found"
// @Router       /profile/{id} [get]
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

	// Check if current user is following this user
	var followCount int64
	config.DB.Model(&models.Follow{}).Where("follower_id = ? AND followed_id = ?", currentUserID, targetUserID).Count(&followCount)
	isFollowing := followCount > 0

	// Get follower and following counts for the target user
	var followersCount, followingCount int64
	config.DB.Model(&models.Follow{}).Where("followed_id = ?", targetUserID).Count(&followersCount)
	config.DB.Model(&models.Follow{}).Where("follower_id = ?", targetUserID).Count(&followingCount)

	// Get activities (events) count for target user (exclude cancelled)
	var activitiesCount int64
	config.DB.Model(&models.Event{}).Where("organizer_id = ? AND deleted_at IS NULL AND status != ?", targetUserID, "cancelled").Count(&activitiesCount)

	profile := types.PublicProfileResponse{
		ID:             user.ID,
		Username:       user.Username,
		DisplayName:    user.DisplayName,
		Bio:            user.Bio,
		City:           user.City,
		Country:        user.Country,
		Sports:         sports,
		AvatarURL:      avatarURL,
		HasAvatar:      hasAvatar,
		FollowersCount: int(followersCount),
		FollowingCount: int(followingCount),
		ActivitiesCount: int(activitiesCount),
		CreatedAt:      user.CreatedAt,
		UpdatedAt:      user.UpdatedAt,
		IsFollowing:    isFollowing,
	}

	c.JSON(http.StatusOK, profile)
}

// UpdateProfile godoc
// @Summary      Update my profile
// @Description  Update the authenticated user's profile fields and sports
// @Tags         Profile
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body  types.ProfileUpdateRequest  true  "Profile update payload"
// @Success      200 {object} types.ProfileResponse "Updated profile"
// @Failure      400 {object} types.ErrorResponse "Invalid payload"
// @Failure      401 {object} types.ErrorResponse "User not authenticated"
// @Router       /profile [put]
func (pc *ProfileController) UpdateProfile(c *gin.Context) {
	// Auth
	uid, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{Error: "Unauthorized", Message: "User not authenticated"})
		return
	}

	// Parse body
	var req types.ProfileUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Error: "Bad Request", Message: "Invalid request body"})
		return
	}

	// Load user
	var user models.User
	if err := config.DB.Preload("Sports").First(&user, uid).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{Error: "User not found", Message: "Profile not found"})
		return
	}

	// Apply updates
	if req.DisplayName != "" { user.DisplayName = req.DisplayName }
	user.Bio = req.Bio
	user.City = req.City
	user.Country = req.Country

	// Update sports if provided
	if req.Sports != nil {
		var sports []models.Sport
		if len(req.Sports) > 0 {
			if err := config.DB.Where("name IN ?", req.Sports).Find(&sports).Error; err != nil {
				c.JSON(http.StatusInternalServerError, types.ErrorResponse{Error: "Database error", Message: "Failed to load sports"})
				return
			}
		}
		if err := config.DB.Model(&user).Association("Sports").Replace(&sports); err != nil {
			c.JSON(http.StatusInternalServerError, types.ErrorResponse{Error: "Database error", Message: "Failed to update sports"})
			return
		}
	}

	if err := config.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Error: "Database error", Message: "Failed to update profile"})
		return
	}

	// Build response reusing GetProfile shape
	var followersCount, followingCount int64
	config.DB.Model(&models.Follow{}).Where("followed_id = ?", user.ID).Count(&followersCount)
	config.DB.Model(&models.Follow{}).Where("follower_id = ?", user.ID).Count(&followingCount)
	var activitiesCount int64
	config.DB.Model(&models.Event{}).Where("organizer_id = ? AND deleted_at IS NULL AND status != ?", user.ID, "cancelled").Count(&activitiesCount)

	sportNames := make([]string, len(user.Sports))
	for i, s := range user.Sports { sportNames[i] = s.Name }

	hasAvatar := len(user.AvatarData) > 0
	avatarURL := fmt.Sprintf("/api/user/%d/avatar", user.ID)

	resp := types.ProfileResponse{
		ID: user.ID,
		Username: user.Username,
		Email: user.Email,
		DisplayName: user.DisplayName,
		Bio: user.Bio,
		City: user.City,
		Country: user.Country,
		Sports: sportNames,
		AvatarURL: avatarURL,
		HasAvatar: hasAvatar,
		FollowersCount: int(followersCount),
		FollowingCount: int(followingCount),
		ActivitiesCount: int(activitiesCount),
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
	}

	c.JSON(http.StatusOK, resp)
}
