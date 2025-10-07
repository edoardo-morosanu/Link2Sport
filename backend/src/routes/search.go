package routes

import (
	"backend/src/controllers"
	"backend/src/middleware"

	"github.com/gin-gonic/gin"
)

// SetupSearchRoutes configures search routes
func SetupSearchRoutes(router *gin.Engine, searchController *controllers.SearchController) {
	// Protected search routes (require JWT authentication)
	searchGroup := router.Group("/api/search")
	searchGroup.Use(middleware.JWTAuth())
	{
		// GET /api/search/users - Search for users
		searchGroup.GET("/users", searchController.SearchUsers)
	}
}
