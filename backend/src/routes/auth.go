package routes

import (
	"backend/src/controllers"

	"github.com/gin-gonic/gin"
)

// SetupAuthRoutes configures authentication routes
func SetupAuthRoutes(router *gin.Engine, authController *controllers.AuthController) {
	// Create auth route group
	authGroup := router.Group("/api/auth")
	{
		// POST /api/auth/register
		authGroup.POST("/register", authController.Register)

		// POST /api/auth/login
		authGroup.POST("/login", authController.Login)

		// POST /api/auth/check-email
		authGroup.POST("/check-email", authController.CheckEmail)

		// POST /api/auth/check-username
		authGroup.POST("/check-username", authController.CheckUsername)
	}
}

// Alternative: Return router function
func AuthRoutes(authController *controllers.AuthController) func(*gin.Engine) {
	return func(router *gin.Engine) {
		SetupAuthRoutes(router, authController)
	}
}
