package routes

import (
	"backend/src/controllers"
	"backend/src/middleware"

	"github.com/gin-gonic/gin"
)

func SetupSportRoutes(r *gin.Engine, sportController *controllers.SportController) {
	api := r.Group("/api")
	{
		// Public routes - anyone can view sports
		api.GET("/sports", sportController.GetAllSports)
		api.GET("/sports/:id", sportController.GetSportByID)

		// Protected routes - require authentication for modifications
		protected := api.Group("/sports")
		protected.Use(middleware.JWTAuth())
		{
			protected.POST("/", sportController.CreateSport)
			protected.PUT("/:id", sportController.UpdateSport)
			protected.DELETE("/:id", sportController.DeleteSport)
		}
	}
}
