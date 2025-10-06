package controllers

import (
	"backend/src/config"
	"backend/src/models"
	"backend/src/types"
	"backend/src/utils"
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthController struct{}

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
	if err := config.DB.Where("username = ?", req.Username).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, types.ErrorResponse{
			Error:   "Username already taken",
			Message: "This username is already in use. Please choose a different one",
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
		City:         req.Location,
		Bio:          req.Bio,
	}

	if err := config.DB.Create(&newUser).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Database Error",
			Message: "Failed to create user",
		})
		return
	}

	// Handle sports associations
	if len(req.Sports) > 0 {
		var sports []models.Sport
		for _, sportName := range req.Sports {
			var sport models.Sport
			// Find or create sport
			if err := config.DB.Where("name = ?", sportName).FirstOrCreate(&sport, models.Sport{Name: sportName}).Error; err != nil {
				c.JSON(http.StatusInternalServerError, types.ErrorResponse{
					Error:   "Database Error",
					Message: "Failed to process sports",
				})
				return
			}
			sports = append(sports, sport)
		}

		// Associate sports with user
		if err := config.DB.Model(&newUser).Association("Sports").Append(sports); err != nil {
			c.JSON(http.StatusInternalServerError, types.ErrorResponse{
				Error:   "Database Error",
				Message: "Failed to associate sports with user",
			})
			return
		}
	}

	c.JSON(http.StatusCreated, types.AuthResponse{
		Message: "Account created successfully! Welcome aboard!",
		UserID:  newUser.ID,
	})
}

// Login - POST /api/auth/login
func (ac *AuthController) Login(c *gin.Context) {
	var req types.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request format",
			Message: err.Error(),
		})
		return
	}

	var user models.User
	if err := config.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusUnauthorized, types.ErrorResponse{
				Error:   "Invalid credentials",
				Message: "Email or password is incorrect",
			})
			return
		}
		// Database error
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Database error",
			Message: "Failed to process login request",
		})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Invalid credentials",
			Message: "Email or password is incorrect",
		})
		return
	}

	token, err := utils.GenerateToken(user.ID, user.Username, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Token generation failed",
			Message: "Failed to generate authentication token",
		})
		return
	}

	c.JSON(http.StatusOK, types.AuthResponse{
		Message: "Login successful",
		UserID:  user.ID,
		Token:   token,
	})
}

func (ac *AuthController) CheckEmail(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request format",
			Message: err.Error(),
		})
		return
	}

	var existingUser models.User
	if err := config.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, types.ErrorResponse{
			Error:   "Email already exists",
			Message: "An account with this email already exists",
		})
		return
	}

	// Email is available
	c.JSON(http.StatusOK, gin.H{
		"message": "Email is available",
		"email":   req.Email,
	})
}

func (ac *AuthController) CheckUsername(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request format",
			Message: err.Error(),
		})
		return
	}

	var existingUser models.User
	if err := config.DB.Where("username = ?", req.Username).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, types.ErrorResponse{
			Error:   "Username already exists",
			Message: "This username is already taken. Please choose a different one.",
		})
		return
	}

	// Username is available
	c.JSON(http.StatusOK, gin.H{
		"message":  "Username is available",
		"username": req.Username,
	})
}
