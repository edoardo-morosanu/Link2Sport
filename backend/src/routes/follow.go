package routes

import (
	"backend/src/controllers"
	"backend/src/middleware"

	"github.com/gin-gonic/gin"
)

func SetupFollowRoutes(router *gin.Engine, followController *controllers.FollowController) {
	followGroup := router.Group("/api/users")
	followGroup.Use(middleware.JWTAuth())

	{
		// Follow/Unfollow actions
		followGroup.POST("/:id/follow", followController.FollowUser)
		followGroup.DELETE("/:id/unfollow", followController.UnfollowUser)
		followGroup.GET("/:id/follow-status", followController.GetFollowStatus)

		// Follow lists and statistics
		followGroup.GET("/:id/followers", followController.GetFollowers)
		followGroup.GET("/:id/following", followController.GetFollowing)
		followGroup.GET("/:id/follow-stats", followController.GetFollowStats)
	}
}
