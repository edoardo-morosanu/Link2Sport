package routes

import (
	"backend/src/controllers"
	"backend/src/middleware"

	"github.com/gin-gonic/gin"
)

func SetupNotificationRoutes(router *gin.Engine, nc *controllers.NotificationController) {
	// SSE stream supports token query; keep it outside JWT middleware
	router.GET("/api/notifications/stream", nc.Stream)

	g := router.Group("/api")
	g.Use(middleware.JWTAuth())
	{
		g.GET("/notifications", nc.ListNotifications)
		g.PATCH("/notifications/:id", nc.MarkRead)
		g.POST("/notifications/mark-all-read", nc.MarkAllRead)
	}
}
