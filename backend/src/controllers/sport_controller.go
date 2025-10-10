package controllers

import (
	"backend/src/config"
	"backend/src/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type SportController struct{}

func NewSportController() *SportController {
	return &SportController{}
}

// GetAllSports godoc
// @Summary Get all sports
// @Description Get a list of all available sports
// @Tags Sports
// @Accept json
// @Produce json
// @Success 200 {array} models.Sport
// @Failure 500 {object} map[string]interface{}
// @Router /api/sports [get]
func (sc *SportController) GetAllSports(c *gin.Context) {
	var sports []models.Sport

	if err := config.DB.Find(&sports).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch sports",
		})
		return
	}

	c.JSON(http.StatusOK, sports)
}

// GetSportByID godoc
// @Summary Get sport by ID
// @Description Get a specific sport by its ID
// @Tags Sports
// @Accept json
// @Produce json
// @Param id path int true "Sport ID"
// @Success 200 {object} models.Sport
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/sports/{id} [get]
func (sc *SportController) GetSportByID(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid sport ID",
		})
		return
	}

	var sport models.Sport
	if err := config.DB.First(&sport, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Sport not found",
		})
		return
	}

	c.JSON(http.StatusOK, sport)
}

// CreateSport godoc
// @Summary Create a new sport
// @Description Create a new sport entry
// @Tags Sports
// @Accept json
// @Produce json
// @Param sport body models.Sport true "Sport object"
// @Success 201 {object} models.Sport
// @Failure 400 {object} map[string]interface{}
// @Failure 409 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /api/sports [post]
func (sc *SportController) CreateSport(c *gin.Context) {
	var sport models.Sport

	if err := c.ShouldBindJSON(&sport); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	if sport.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Sport name is required",
		})
		return
	}

	if err := config.DB.Create(&sport).Error; err != nil {
		// Check if it's a duplicate key error
		if config.DB.Migrator().HasConstraint(&models.Sport{}, "name") {
			c.JSON(http.StatusConflict, gin.H{
				"error": "Sport with this name already exists",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create sport",
		})
		return
	}

	c.JSON(http.StatusCreated, sport)
}

// UpdateSport godoc
// @Summary Update a sport
// @Description Update an existing sport by ID
// @Tags Sports
// @Accept json
// @Produce json
// @Param id path int true "Sport ID"
// @Param sport body models.Sport true "Updated sport object"
// @Success 200 {object} models.Sport
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 409 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /api/sports/{id} [put]
func (sc *SportController) UpdateSport(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid sport ID",
		})
		return
	}

	var existingSport models.Sport
	if err := config.DB.First(&existingSport, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Sport not found",
		})
		return
	}

	var updatedSport models.Sport
	if err := c.ShouldBindJSON(&updatedSport); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	if updatedSport.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Sport name is required",
		})
		return
	}

	existingSport.Name = updatedSport.Name

	if err := config.DB.Save(&existingSport).Error; err != nil {
		// Check if it's a duplicate key error
		if config.DB.Migrator().HasConstraint(&models.Sport{}, "name") {
			c.JSON(http.StatusConflict, gin.H{
				"error": "Sport with this name already exists",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update sport",
		})
		return
	}

	c.JSON(http.StatusOK, existingSport)
}

// DeleteSport godoc
// @Summary Delete a sport
// @Description Delete a sport by ID
// @Tags Sports
// @Accept json
// @Produce json
// @Param id path int true "Sport ID"
// @Success 204
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Security BearerAuth
// @Router /api/sports/{id} [delete]
func (sc *SportController) DeleteSport(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid sport ID",
		})
		return
	}

	var sport models.Sport
	if err := config.DB.First(&sport, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Sport not found",
		})
		return
	}

	if err := config.DB.Delete(&sport).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete sport",
		})
		return
	}

	c.Status(http.StatusNoContent)
}
