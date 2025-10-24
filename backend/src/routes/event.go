package routes

import (
	"backend/src/controllers"
	"backend/src/middleware"

	"github.com/gin-gonic/gin"
)

func SetupEventRoutes(router *gin.Engine, eventController *controllers.EventController) {
	eventGroup := router.Group("/api/events")
	eventGroup.Use(middleware.JWTAuth())

	{
		// Create event
		eventGroup.POST("/", eventController.CreateEvent)

		// Get all events (with filtering)
		eventGroup.GET("/", eventController.GetEvents)

		// Get user's own events
		eventGroup.GET("/my", eventController.GetUserEvents)

		// Get another user's events by organizer ID
		eventGroup.GET("/user/:id", eventController.GetUserEventsByID)

		// Get specific event
		eventGroup.GET("/:id", eventController.GetEvent)

		// Update event
		eventGroup.PUT("/:id", eventController.UpdateEvent)

		// Delete event
		eventGroup.DELETE("/:id", eventController.DeleteEvent)

		// Join/Leave events
		eventGroup.POST("/:id/join", eventController.JoinEvent)
		eventGroup.DELETE("/:id/leave", eventController.LeaveEvent)

		// Get event participants
		eventGroup.GET("/:id/participants", eventController.GetEventParticipants)

		// Status update routes
		eventGroup.POST("/update-statuses", eventController.UpdateEventStatuses)
		eventGroup.GET("/needing-update", eventController.GetEventsNeedingUpdate)
	}
}
