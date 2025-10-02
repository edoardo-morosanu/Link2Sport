package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// healthHandler handles the health check endpoint
// @Summary Health check
// @Description Get the health status of the API
// @Tags health
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /health [get]
func HealthHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":   "healthy",
		"message":  "Backend API is running",
		"database": "connected",
	})
}

// welcomeHandler handles the welcome endpoint
// @Summary Welcome message
// @Description Get welcome message for API v1
// @Tags general
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router / [get]
func WelcomeHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Welcome to the API",
		"version": "1.0.0",
	})
}
