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

type FollowController struct{}

func NewFollowController() *FollowController {
	return &FollowController{}
}

// FollowUser godoc
// @Summary      Follow a user
// @Description  Follow another user by their ID
// @Tags         Follow
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "User ID to follow" example(12345)
// @Success      200 {object} types.FollowResponse "Successfully followed user"
// @Failure      400 {object} types.ErrorResponse "Invalid user ID or trying to follow yourself"
// @Failure      401 {object} types.ErrorResponse "User not authenticated"
// @Failure      404 {object} types.ErrorResponse "User not found"
// @Failure      409 {object} types.ErrorResponse "Already following user"
// @Router       /users/{id}/follow [post]
func (fc *FollowController) FollowUser(c *gin.Context) {
	currentUserID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "User not authenticated",
		})
		return
	}

	targetUserIDParam := c.Param("id")
	targetUserID, err := strconv.ParseUint(targetUserIDParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid user ID",
			Message: "User ID must be a valid number",
		})
		return
	}

	if currentUserID == uint(targetUserID) {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid Request",
			Message: "You cannot follow yourself",
		})
		return
	}

	var targetUser models.User
	if err := config.DB.First(&targetUser, targetUserID).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Error:   "User not found",
			Message: "The user you're trying to follow does not exist",
		})
		return
	}

	var existingFollow models.Follow
	if err := config.DB.Where("follower_id = ? AND followed_id = ?", currentUserID, targetUserID).First(&existingFollow).Error; err == nil {
		c.JSON(http.StatusConflict, types.ErrorResponse{
			Error:   "Already following",
			Message: "You are already following this user",
		})
		return
	}

	follow := models.Follow{
		FollowerID: currentUserID.(uint),
		FollowedID: uint(targetUserID),
	}

	if err := config.DB.Create(&follow).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Database error",
			Message: "Failed to create follow relationship",
		})
		return
	}

	c.JSON(http.StatusOK, types.FollowResponse{
		Success:     true,
		Message:     fmt.Sprintf("Successfully followed %s", targetUser.Username),
		IsFollowing: true,
	})
}

// UnfollowUser godoc
// @Summary      Unfollow a user
// @Description  Unfollow a user by their ID
// @Tags         Follow
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "User ID to unfollow" example(12345)
// @Success      200 {object} types.FollowResponse "Successfully unfollowed user"
// @Failure      400 {object} types.ErrorResponse "Invalid user ID or trying to unfollow yourself"
// @Failure      401 {object} types.ErrorResponse "User not authenticated"
// @Failure      404 {object} types.ErrorResponse "User not found or not following"
// @Router       /users/{id}/unfollow [delete]
func (fc *FollowController) UnfollowUser(c *gin.Context) {
	currentUserID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "User not authenticated",
		})
		return
	}

	targetUserIDParam := c.Param("id")
	targetUserID, err := strconv.ParseUint(targetUserIDParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid user ID",
			Message: "User ID must be a valid number",
		})
		return
	}

	if currentUserID == uint(targetUserID) {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Message: "You cannot unfollow yourself",
		})
		return
	}

	var targetUser models.User
	if err := config.DB.First(&targetUser, targetUserID).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Error:   "User not found",
			Message: "The user you're trying to unfollow does not exist",
		})
		return
	}

	result := config.DB.Where("follower_id = ? AND followed_id = ?", currentUserID, targetUserID).Delete(&models.Follow{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Database error",
			Message: "Failed to remove follow relationship",
		})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Error:   "Not following",
			Message: "You are not following this user",
		})
		return
	}

	c.JSON(http.StatusOK, types.FollowResponse{
		Success:     true,
		Message:     fmt.Sprintf("Successfully unfollowed %s", targetUser.Username),
		IsFollowing: false,
	})
}

// GetFollowStatus godoc
// @Summary      Check follow status
// @Description  Check if current user is following another user
// @Tags         Follow
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "User ID to check" example(12345)
// @Success      200 {object} types.FollowResponse "Follow status"
// @Failure      400 {object} types.ErrorResponse "Invalid user ID"
// @Failure      401 {object} types.ErrorResponse "User not authenticated"
// @Router       /users/{id}/follow-status [get]
func (fc *FollowController) GetFollowStatus(c *gin.Context) {
	currentUserID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "User not authenticated",
		})
		return
	}

	targetUserIDParam := c.Param("id")
	targetUserID, err := strconv.ParseUint(targetUserIDParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid user ID",
			Message: "User ID must be a valid number",
		})
		return
	}

	var followCount int64
	config.DB.Model(&models.Follow{}).Where("follower_id = ? AND followed_id = ?", currentUserID, targetUserID).Count(&followCount)
	isFollowing := followCount > 0

	message := "Not following user"
	if isFollowing {
		message = "Following user"
	}

	c.JSON(http.StatusOK, types.FollowResponse{
		Success:     true,
		Message:     message,
		IsFollowing: isFollowing,
	})
}

// GetFollowers godoc
// @Summary      Get user's followers
// @Description  Get a paginated list of users who follow the specified user
// @Tags         Follow
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "User ID" example(12345)
// @Param        page query int false "Page number" default(1)
// @Param        limit query int false "Items per page" default(20)
// @Success      200 {object} types.FollowListResponse "List of followers"
// @Failure      400 {object} types.ErrorResponse "Invalid parameters"
// @Failure      401 {object} types.ErrorResponse "User not authenticated"
// @Router       /users/{id}/followers [get]
func (fc *FollowController) GetFollowers(c *gin.Context) {
	currentUserID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "User not authenticated",
		})
		return
	}

	targetUserIDParam := c.Param("id")
	targetUserID, err := strconv.ParseUint(targetUserIDParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid user ID",
			Message: "User ID must be a valid number",
		})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	var follows []models.Follow
	if err := config.DB.Preload("Follower").
		Where("followed_id = ?", targetUserID).
		Offset(offset).
		Limit(limit).
		Order("created_at DESC").
		Find(&follows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Database error",
			Message: "Failed to fetch followers",
		})
		return
	}

	var totalCount int64
	config.DB.Model(&models.Follow{}).Where("followed_id = ?", targetUserID).Count(&totalCount)

	followerIDs := make([]uint, len(follows))
	for i, follow := range follows {
		followerIDs[i] = follow.FollowedID
	}

	var mutualFollows []uint
	if len(followerIDs) > 0 {
		config.DB.Model(&models.Follow{}).
			Where("follower_id = ? AND followed_id IN (?)", currentUserID, followerIDs).
			Pluck("followed_id", &mutualFollows)
	}

	mutualMap := make(map[uint]bool)
	for _, id := range mutualFollows {
		mutualMap[id] = true
	}

	followers := make([]types.FollowerResponse, len(follows))
	for i, follow := range follows {
		hasAvatar := len(follow.Follower.AvatarData) > 0
		avatarURL := fmt.Sprintf("/api/user/%d/avatar", follow.Follower.ID)

		followers[i] = types.FollowerResponse{
			ID:          follow.Follower.ID,
			Username:    follow.Follower.Username,
			DisplayName: follow.Follower.DisplayName,
			AvatarURL:   avatarURL,
			HasAvatar:   hasAvatar,
			IsFollowing: mutualMap[follow.FollowerID],
			FollowedAt:  follow.CreatedAt,
		}
	}

	response := types.FollowListResponse{
		Users:      followers,
		TotalCount: int(totalCount),
		Page:       page,
		PerPage:    limit,
		HasNext:    int64(offset+limit) < totalCount,
	}

	c.JSON(http.StatusOK, response)
}

// GetFollowing godoc
// @Summary      Get users that a user follows
// @Description  Get a paginated list of users that the specified user follows
// @Tags         Follow
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "User ID" example(12345)
// @Param        page query int false "Page number" default(1)
// @Param        limit query int false "Items per page" default(20)
// @Success      200 {object} types.FollowListResponse "List of following"
// @Failure      400 {object} types.ErrorResponse "Invalid parameters"
// @Failure      401 {object} types.ErrorResponse "User not authenticated"
// @Router       /users/{id}/following [get]
func (fc *FollowController) GetFollowing(c *gin.Context) {
	_, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "User not authenticated",
		})
		return
	}

	targetUserIDParam := c.Param("id")
	targetUserID, err := strconv.ParseUint(targetUserIDParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid user ID",
			Message: "User ID must be a valid number",
		})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	var follows []models.Follow
	if err := config.DB.Preload("Followed").
		Where("follower_id = ?", targetUserID).
		Offset(offset).
		Limit(limit).
		Order("created_at DESC").
		Find(&follows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Database error",
			Message: "Failed to fetch following",
		})
		return
	}

	var totalCount int64
	config.DB.Model(&models.Follow{}).Where("follower_id = ?", targetUserID).Count(&totalCount)

	followedIDs := make([]uint, len(follows))
	for i, follow := range follows {
		followedIDs[i] = follow.FollowedID
	}

	var followsBack []uint
	if len(followedIDs) > 0 {
		config.DB.Model(&models.Follow{}).
			Where("follower_id IN (?) AND followed_id = ?", followedIDs, targetUserID).
			Pluck("follower_id", &followsBack)
	}

	followsBackMap := make(map[uint]bool)
	for _, id := range followsBack {
		followsBackMap[id] = true
	}

	following := make([]types.FollowingResponse, len(follows))
	for i, follow := range follows {
		hasAvatar := len(follow.Followed.AvatarData) > 0
		avatarURL := fmt.Sprintf("/api/user/%d/avatar", follow.Followed.ID)

		following[i] = types.FollowingResponse{
			ID:          follow.Followed.ID,
			Username:    follow.Followed.Username,
			DisplayName: follow.Followed.DisplayName,
			AvatarURL:   avatarURL,
			HasAvatar:   hasAvatar,
			FollowsBack: followsBackMap[follow.FollowedID],
			FollowedAt:  follow.CreatedAt,
		}
	}

	response := types.FollowListResponse{
		Users:      following,
		TotalCount: int(totalCount),
		Page:       page,
		PerPage:    limit,
		HasNext:    int64(offset+limit) < totalCount,
	}

	c.JSON(http.StatusOK, response)
}

// GetFollowStats godoc
// @Summary      Get follow statistics
// @Description  Get follower and following counts for a user
// @Tags         Follow
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "User ID" example(12345)
// @Success      200 {object} types.FollowStatsResponse "Follow statistics"
// @Failure      400 {object} types.ErrorResponse "Invalid user ID"
// @Failure      401 {object} types.ErrorResponse "User not authenticated"
// @Router       /users/{id}/follow-stats [get]
func (fc *FollowController) GetFollowStats(c *gin.Context) {
	_, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "User not authenticated",
		})
		return
	}

	targetUserIDParam := c.Param("id")
	targetUserID, err := strconv.ParseUint(targetUserIDParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid user ID",
			Message: "User ID must be a valid number",
		})
		return
	}

	var user models.User
	if err := config.DB.First(&user, targetUserID).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Error:   "User not found",
			Message: "User does not exist",
		})
		return
	}

	var followersCount int64
	config.DB.Model(&models.Follow{}).Where("followed_id = ?", targetUserID).Count(&followersCount)

	var followingCount int64
	config.DB.Model(&models.Follow{}).Where("follower_id = ?", targetUserID).Count(&followingCount)

	response := types.FollowStatsResponse{
		FollowersCount: int(followersCount),
		FollowingCount: int(followingCount),
	}

	c.JSON(http.StatusOK, response)
}
