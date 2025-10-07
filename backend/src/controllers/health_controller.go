package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// HealthHandler godoc
// @Summary      Health check
// @Description  Get the health status of the API and database connection
// @Tags         Health
// @Accept       json
// @Produce      json
// @Success      200 {object} object{status=string,message=string,database=string} "API health status" example({"status": "healthy", "message": "Backend API is running", "database": "connected"})
// @Router       /health [get]
func HealthHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":   "healthy",
		"message":  "Backend API is running",
		"database": "connected",
	})
}

// WelcomeHandler godoc
// @Summary      API welcome message
// @Description  Get welcome message and version information for the Link2Sport API
// @Tags         General
// @Accept       json
// @Produce      json
// @Success      200 {object} object{message=string,version=string} "Welcome message and API version" example({"message": "Welcome to the API", "version": "1.0.0"})
// @Router       /api/v1/ [get]
func WelcomeHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Welcome to the API",
		"version": "1.0.0",
	})
}
