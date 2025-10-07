package routes

import (
	"backend/src/controllers"
	"backend/src/middleware"

	"github.com/gin-gonic/gin"
)

func SetupProfileRoutes(router *gin.Engine, profileController *controllers.ProfileController) {
	profileGroup := router.Group("/api")
	profileGroup.Use(middleware.JWTAuth())

	{
		profileGroup.GET("/profile", profileController.GetProfile)
		profileGroup.GET("/users/:id", profileController.GetPublicProfile)

		// profileGroup.PUT("/profile", profileController.UpdateProfile)
	}
}
