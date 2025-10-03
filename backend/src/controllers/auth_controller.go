package controllers

import (
	"backend/src/config"
	"backend/src/models"
	"backend/src/types"
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	// "gorm.io/gorm"
)

type AuthController struct {
	// Add your service dependencies here
}

func NewAuthController() *AuthController {
	return &AuthController{}
}

// Register - POST /api/auth/register
func (ac *AuthController) Register(c *gin.Context) {
	var req types.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request format",
			Message: err.Error(),
		})
		return
	}

	if req.Password != req.ConfirmPassword {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Password mismatch",
			Message: "Password and confirm password do not match",
		})
		return
	}

	var existingUser models.User
	if err := config.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, types.ErrorResponse{
			Error:   "User already exists.",
			Message: "A user with this email already exists",
		})
		return
	}

	if err := config.DB.Where("username = ?", req.Username).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, types.ErrorResponse{
			Error:   "Username already exists.",
			Message: "A user with this username already exists",
		})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Password hashing failed",
			Message: "Failed to process password",
		})
		return
	}

	newUser := models.User{
		Email:        req.Email,
		Username:     req.Username,
		PasswordHash: string(hashedPassword),
		DisplayName:  req.FirstName + " " + req.LastName,
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "Validation passed",
		"email":    newUser.Email,
		"username": newUser.Username,
		"name":     newUser.DisplayName,
	})
}

// Login - POST /api/auth/login
func (ac *AuthController) Login(c *gin.Context) {
	// TODO: Implement login logic here

	c.JSON(http.StatusOK, gin.H{
		"message": "Login endpoint",
	})
}
