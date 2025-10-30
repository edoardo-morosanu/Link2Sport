package routes

import (
	"backend/src/controllers"
	"backend/src/middleware"

	"github.com/gin-gonic/gin"
)

// SetupPostRoutes configures post routes
func SetupPostRoutes(router *gin.Engine, postController *controllers.PostController) {
	postGroup := router.Group("/api/posts")
	postGroup.Use(middleware.JWTAuth())
	
	{
		// Create post
		postGroup.POST("/", postController.CreatePost)

		// Get posts
		postGroup.GET("/", postController.GetPosts)

		// Get current user's posts
		postGroup.GET("/my", postController.GetUserPosts)

		// Get another user's published posts by ID
		postGroup.GET("/user/:id", postController.GetUserPostsByID)

		// Get single post by ID
		postGroup.GET("/:id", postController.GetPost)

		// Delete a post
		postGroup.DELETE("/:id", postController.DeletePost)

		// Update a post
		postGroup.PUT("/:id", postController.UpdatePost)

		// Upload post image
		postGroup.POST("/:id/image", postController.UploadPostImage)

		// Toggle like on a post
		postGroup.POST("/:id/like", postController.ToggleLike)

		// Comments on a post
		postGroup.GET("/:id/comments", postController.GetPostComments)
		postGroup.POST("/:id/comments", postController.CreateComment)
		postGroup.DELETE("/:id/comments/:commentId", postController.DeleteComment)

		// Temporary: Ping route to verify posts group reachability
		postGroup.GET("/ping", func(c *gin.Context) { c.Status(200) })
	}

	// Public route to fetch post images without requiring JWT
	router.GET("/api/posts/:id/image", postController.GetPostImage)
}
