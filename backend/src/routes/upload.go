package routes

import (
	"backend/src/controllers"
	"backend/src/middleware"

	"github.com/gin-gonic/gin"
)

// SetupUploadRoutes configures file upload routes
func SetupUploadRoutes(router *gin.Engine, uploadController *controllers.UploadController) {
	// Protected upload routes (require JWT authentication)
	uploadGroup := router.Group("/api/upload")
	uploadGroup.Use(middleware.JWTAuth())
	{
		// POST /api/upload/avatar - Upload new avatar
		uploadGroup.POST("/avatar", uploadController.UploadAvatar)

		// DELETE /api/upload/avatar - Delete current avatar
		uploadGroup.DELETE("/avatar", uploadController.DeleteAvatar)
	}

	// Public routes for serving avatars
	userGroup := router.Group("/api/user")
	{
		// GET /api/user/:userId/avatar - Get user's avatar (serves default if no custom avatar)
		userGroup.GET("/:userId/avatar", uploadController.GetAvatar)
	}
}
