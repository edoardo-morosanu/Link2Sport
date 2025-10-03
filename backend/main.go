package main

import (
	"backend/src/config"
	"backend/src/controllers"
	"backend/src/routes"
	"log"
	"net/http"

	_ "backend/docs"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func main() {
	// Initialize database connection
	if err := config.InitDatabase(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer config.CloseDatabase()

	r := gin.Default()

	// Configure CORS
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = []string{"http://localhost:3000"}
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	corsConfig.AllowHeaders = []string{"Origin", "Content-Type", "Authorization"}
	r.Use(cors.New(corsConfig))

	// Swagger endpoints
	r.GET("/docs", func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, "/docs/index.html")
	})
	r.GET("/docs/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Health check endpoint
	r.GET("/health", controllers.HealthHandler)

	// Initialize controllers
	authController := controllers.NewAuthController()

	// Setup authentication routes
	routes.SetupAuthRoutes(r, authController)

	// API v1 routes (existing routes)
	v1 := r.Group("/api/v1")
	{
		v1.GET("/", controllers.WelcomeHandler)
	}

	r.Run(":8080")
}
