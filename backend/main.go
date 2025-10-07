package main

import (
	"backend/src/config"
	"backend/src/controllers"
	"backend/src/models"
	"backend/src/routes"
	"log"
	"net/http"
	"time"

	_ "backend/docs"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// @title           Link2Sport API
// @version         1.0
// @description     A comprehensive API for connecting sports enthusiasts, managing profiles, and facilitating sports-related activities.
// @description     This API provides authentication, user profile management, search functionality, and file upload capabilities.
// @termsOfService  http://swagger.io/terms/

// @contact.name   API Support
// @contact.url    http://www.swagger.io/support
// @contact.email  support@swagger.io

// @license.name  Apache 2.0
// @license.url   http://www.apache.org/licenses/LICENSE-2.0.html

// @host      localhost:8080
// @BasePath  /api
// @schemes   http https

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token.

// @tag.name Authentication
// @tag.description User authentication and registration endpoints

// @tag.name Profile
// @tag.description User profile management endpoints

// @tag.name Search
// @tag.description User search functionality

// @tag.name Upload
// @tag.description File upload and avatar management

// @tag.name Health
// @tag.description API health and status endpoints

// @tag.name General
// @tag.description General API information endpoints

// @externalDocs.description  Link2Sport Documentation
// @externalDocs.url          https://swagger.io/resources/open-api/

func main() {
	// Initialize database connection
	if err := config.InitDatabase(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer config.CloseDatabase()

	// Run database migrations
	if err := config.AutoMigrate(&models.User{}); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	r := gin.Default()

	// Configure CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://127.0.0.1:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Swagger endpoints
	r.GET("/docs", func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, "/docs/index.html")
	})
	r.GET("/docs/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Health check endpoint
	r.GET("/health", controllers.HealthHandler)

	// Initialize controllers
	authController := controllers.NewAuthController()
	profileController := controllers.NewProfileController()
	uploadController := controllers.NewUploadController()
	searchController := controllers.NewSearchController()

	// Setup routes
	routes.SetupAuthRoutes(r, authController)
	routes.SetupProfileRoutes(r, profileController)
	routes.SetupUploadRoutes(r, uploadController)
	routes.SetupSearchRoutes(r, searchController)

	// API v1 routes (existing routes)
	v1 := r.Group("/api/v1")
	{
		v1.GET("/", controllers.WelcomeHandler)
	}

	r.Run(":8080")
}
