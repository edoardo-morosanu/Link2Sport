package controllers

import (
	"backend/src/config"
	"backend/src/models"
	"backend/src/types"
	"backend/src/utils"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/url"
	"strings"

	"github.com/gin-gonic/gin"
)

type UploadController struct{}

func NewUploadController() *UploadController {
	return &UploadController{}
}

// UploadAvatar - POST /api/upload/avatar
func (uc *UploadController) UploadAvatar(c *gin.Context) {
	userID, ok := uc.validateUploadAuthentication(c)
	if !ok {
		return
	}

	fileHeader, ok := uc.validateUploadedFile(c)
	if !ok {
		return
	}

	user, ok := uc.getCurrentUser(c, userID)
	if !ok {
		return
	}

	fileContent, contentType, ok := uc.processFileContent(c, fileHeader)
	if !ok {
		return
	}

	if !uc.updateUserAvatar(c, &user, fileContent, contentType) {
		return
	}

	uc.sendUploadSuccessResponse(c, user.ID)
}

// validateUploadAuthentication validates user authentication for upload
func (uc *UploadController) validateUploadAuthentication(c *gin.Context) (interface{}, bool) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.FileUploadError{
			Error:   "Unauthorized",
			Message: "User not authenticated",
		})
		return nil, false
	}
	return userID, true
}

// validateUploadedFile validates the uploaded file
func (uc *UploadController) validateUploadedFile(c *gin.Context) (*multipart.FileHeader, bool) {
	fileHeader, err := c.FormFile("avatar")
	if err != nil {
		c.JSON(http.StatusBadRequest, types.FileUploadError{
			Error:     "No file uploaded",
			Message:   "Please select an image file to upload",
			ErrorCode: "NO_FILE",
		})
		return nil, false
	}

	if err := utils.ValidateImageFile(fileHeader); err != nil {
		c.JSON(http.StatusBadRequest, types.FileUploadError{
			Error:     "Invalid file",
			Message:   err.Error(),
			ErrorCode: "INVALID_FILE",
		})
		return nil, false
	}

	return fileHeader, true
}

// getCurrentUser retrieves the current user from database
func (uc *UploadController) getCurrentUser(c *gin.Context, userID interface{}) (models.User, bool) {
	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, types.FileUploadError{
			Error:   "User not found",
			Message: "Unable to find user profile",
		})
		return user, false
	}
	return user, true
}

// processFileContent processes the uploaded file content
func (uc *UploadController) processFileContent(c *gin.Context, fileHeader *multipart.FileHeader) ([]byte, string, bool) {
	file, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.FileUploadError{
			Error:   "File processing failed",
			Message: "Unable to read uploaded file",
		})
		return nil, "", false
	}
	defer file.Close()

	fileContent, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.FileUploadError{
			Error:   "File processing failed",
			Message: "Unable to process uploaded file",
		})
		return nil, "", false
	}

	contentType := fileHeader.Header.Get("Content-Type")
	if contentType == "" {
		contentType = utils.GetContentTypeFromExtension(fileHeader.Filename)
	}

	return fileContent, contentType, true
}

// updateUserAvatar updates the user's avatar in the database
func (uc *UploadController) updateUserAvatar(c *gin.Context, user *models.User, fileContent []byte, contentType string) bool {
	updates := map[string]any{
		"avatar_data": fileContent,
		"avatar_type": contentType,
	}

	if err := config.DB.Model(user).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.FileUploadError{
			Error:   "Database error",
			Message: "Failed to update user profile",
		})
		return false
	}
	return true
}

// sendUploadSuccessResponse sends the success response for avatar upload
func (uc *UploadController) sendUploadSuccessResponse(c *gin.Context, userID uint) {
	avatarURL := fmt.Sprintf("/api/user/%d/avatar", userID)
	c.JSON(http.StatusOK, types.UploadResponse{
		Message:   "Avatar uploaded successfully",
		Success:   true,
		AvatarURL: avatarURL,
	})
}

// DeleteAvatar - DELETE /api/upload/avatar
func (uc *UploadController) DeleteAvatar(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.FileUploadError{
			Error:   "Unauthorized",
			Message: "User not authenticated",
		})
		return
	}

	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, types.FileUploadError{
			Error:   "User not found",
			Message: "Unable to find user profile",
		})
		return
	}

	if len(user.AvatarData) == 0 {
		c.JSON(http.StatusBadRequest, types.FileUploadError{
			Error:   "No avatar to delete",
			Message: "User doesn't have a custom avatar",
		})
		return
	}

	// Clear avatar data
	updates := map[string]any{
		"avatar_data": nil,
		"avatar_type": "",
	}

	if err := config.DB.Model(&user).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.FileUploadError{
			Error:   "Database error",
			Message: "Failed to delete avatar",
		})
		return
	}

	c.JSON(http.StatusOK, types.UploadResponse{
		Message: "Avatar deleted successfully",
		Success: true,
	})
}

// GetAvatar - GET /api/user/:userId/avatar
func (uc *UploadController) GetAvatar(c *gin.Context) {
	userID := c.Param("userId")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "User ID is required",
		})
		return
	}

	var user models.User
	if err := config.DB.Select("avatar_data, avatar_type, username, display_name").First(&user, userID).Error; err != nil {
		// User not found - serve default avatar with generic name
		uc.serveDefaultAvatar(c, "User")
		return
	}

	if len(user.AvatarData) > 0 {
		contentType := user.AvatarType
		if contentType == "" {
			contentType = "image/jpeg"
		}

		c.Header("Content-Type", contentType)
		c.Header("Cache-Control", "public, max-age=86400")
		c.Data(http.StatusOK, contentType, user.AvatarData)
		return
	}

	// No custom avatar - return 404 (frontend will handle placeholder)
	c.JSON(http.StatusNotFound, gin.H{
		"error": "No avatar found",
	})
}

// serveDefaultAvatar serves a customized default avatar based on the user's name
func (uc *UploadController) serveDefaultAvatar(c *gin.Context, name string) {
	// Clean the name for URL encoding
	cleanName := strings.TrimSpace(name)
	if cleanName == "" {
		cleanName = "User"
	}

	// URL encode the name to handle special characters
	encodedName := url.QueryEscape(cleanName)

	// Generate background color based on name (for consistency)
	backgroundColor := uc.generateColorFromName(cleanName)

	// Create customized UI-Avatars URL
	defaultAvatarURL := fmt.Sprintf(
		"https://ui-avatars.com/api/?name=%s&size=200&background=%s&color=fff&bold=true&format=png",
		encodedName,
		backgroundColor,
	)

	// Set cache headers before redirect
	c.Header("Cache-Control", "public, max-age=3600") // Cache for 1 hour
	c.Redirect(http.StatusFound, defaultAvatarURL)
}

// generateColorFromName generates a consistent color based on the name
func (uc *UploadController) generateColorFromName(name string) string {
	colors := []string{
		"3b82f6", // blue
		"ef4444", // red
		"10b981", // green
		"f59e0b", // yellow
		"8b5cf6", // purple
		"06b6d4", // cyan
		"f97316", // orange
		"84cc16", // lime
		"ec4899", // pink
		"6366f1", // indigo
	}

	// Simple hash function to get consistent color
	hash := 0
	for _, char := range name {
		hash += int(char)
	}

	// Use modulo to select color from palette
	colorIndex := hash % len(colors)
	return colors[colorIndex]
}
