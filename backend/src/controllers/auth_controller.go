package controllers

import (
	"backend/src/config"
	"backend/src/models"
	"backend/src/types"
	"backend/src/utils"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthController struct{}

func NewAuthController() *AuthController {
	return &AuthController{}
}

// Register godoc
// @Summary      Register a new user
// @Description  Create a new user account with profile information and associated sports
// @Tags         Authentication
// @Accept       json
// @Produce      json
// @Param        request body types.RegisterRequest true "User registration data"
// @Success      201 {object} types.AuthResponse "User successfully registered"
// @Failure      400 {object} types.ErrorResponse "Invalid request format or password mismatch"
// @Failure      409 {object} types.ErrorResponse "Username already taken"
// @Failure      500 {object} types.ErrorResponse "Internal server error"
// @Router       /auth/register [post]
func (ac *AuthController) Register(c *gin.Context) {
	req, ok := ac.validateRegisterRequest(c)
	if !ok {
		return
	}

	if !ac.checkUsernameAvailability(c, req.Username) {
		return
	}

	newUser, ok := ac.createUserRecord(c, req)
	if !ok {
		return
	}

	if !ac.processSportsAssociation(c, &newUser, req.Sports) {
		return
	}

	ac.sendRegistrationSuccessResponse(c, newUser.ID)
}

// validateRegisterRequest validates the registration request and returns the request data
func (ac *AuthController) validateRegisterRequest(c *gin.Context) (types.RegisterRequest, bool) {
	var req types.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request format",
			Message: err.Error(),
		})
		return req, false
	}

	if req.Password != req.ConfirmPassword {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Password mismatch",
			Message: "Password and confirm password do not match",
		})
		return req, false
	}

	return req, true
}

// checkUsernameAvailability checks if the username is already taken
func (ac *AuthController) checkUsernameAvailability(c *gin.Context, username string) bool {
	var existingUser models.User
	if err := config.DB.Where("username = ?", username).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, types.ErrorResponse{
			Error:   "Username already taken",
			Message: "This username is already in use. Please choose a different one",
		})
		return false
	}
	return true
}

// createUserRecord creates a new user record with hashed password
func (ac *AuthController) createUserRecord(c *gin.Context, req types.RegisterRequest) (models.User, bool) {
	var newUser models.User

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Password hashing failed",
			Message: "Failed to process password",
		})
		return newUser, false
	}

	newUser = models.User{
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
		return newUser, false
	}

	return newUser, true
}

// processSportsAssociation handles sports processing and association with user
func (ac *AuthController) processSportsAssociation(c *gin.Context, user *models.User, sportNames []string) bool {
	if len(sportNames) == 0 {
		return true
	}

	var sports []models.Sport
	for _, sportName := range sportNames {
		var sport models.Sport
		// Find or create sport
		if err := config.DB.Where("name = ?", sportName).FirstOrCreate(&sport, models.Sport{Name: sportName}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, types.ErrorResponse{
				Error:   "Database Error",
				Message: "Failed to process sports",
			})
			return false
		}
		sports = append(sports, sport)
	}

	// Associate sports with user
	if err := config.DB.Model(user).Association("Sports").Append(sports); err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Database Error",
			Message: "Failed to associate sports with user",
		})
		return false
	}

	return true
}

// sendRegistrationSuccessResponse sends the success response for registration
func (ac *AuthController) sendRegistrationSuccessResponse(c *gin.Context, userID uint) {
	c.JSON(http.StatusCreated, types.AuthResponse{
		Message: "Account created successfully! Welcome aboard!",
		UserID:  userID,
	})
}

// Login godoc
// @Summary      User login
// @Description  Authenticate user with email and password, returns JWT token
// @Tags         Authentication
// @Accept       json
// @Produce      json
// @Param        credentials body types.LoginRequest true "User login credentials"
// @Success      200 {object} types.AuthResponse "Login successful with JWT token"
// @Failure      400 {object} types.ErrorResponse "Invalid request format"
// @Failure      401 {object} types.ErrorResponse "Invalid credentials"
// @Failure      500 {object} types.ErrorResponse "Database error or token generation failed"
// @Router       /auth/login [post]
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

// FieldAvailabilityConfig holds configuration for field availability checks
type FieldAvailabilityConfig struct {
	DBColumn        string
	ValidationTag   string
	ConflictError   string
	ConflictMessage string
	SuccessMessage  string
	ResponseKey     string
}

// fieldConfigs defines the configuration for different field types
var fieldConfigs = map[string]FieldAvailabilityConfig{
	"email": {
		DBColumn:        "email",
		ValidationTag:   "required,email",
		ConflictError:   "Email already exists",
		ConflictMessage: "An account with this email already exists",
		SuccessMessage:  "Email is available",
		ResponseKey:     "email",
	},
	"username": {
		DBColumn:        "username",
		ValidationTag:   "required",
		ConflictError:   "Username already exists",
		ConflictMessage: "This username is already taken. Please choose a different one.",
		SuccessMessage:  "Username is available",
		ResponseKey:     "username",
	},
}

// handleFieldAvailabilityCheck is a generic handler for field availability checks
func (ac *AuthController) handleFieldAvailabilityCheck(c *gin.Context, fieldType string) {
	fieldConfig, exists := fieldConfigs[fieldType]
	if !exists {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Configuration error",
			Message: "Invalid field type",
		})
		return
	}

	// Parse the request dynamically based on field type
	requestBody := map[string]interface{}{}
	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request format",
			Message: err.Error(),
		})
		return
	}

	// Extract the field value
	fieldValue, exists := requestBody[fieldType]
	if !exists {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Missing field",
			Message: fmt.Sprintf("Field '%s' is required", fieldType),
		})
		return
	}

	value, ok := fieldValue.(string)
	if !ok {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid field type",
			Message: fmt.Sprintf("Field '%s' must be a string", fieldType),
		})
		return
	}

	// Basic validation
	if fieldType == "email" && !isValidEmail(value) {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid email format",
			Message: "Please provide a valid email address",
		})
		return
	}

	if strings.TrimSpace(value) == "" {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Empty field",
			Message: fmt.Sprintf("Field '%s' cannot be empty", fieldType),
		})
		return
	}

	// Check availability in database
	var existingUser models.User
	query := fieldConfig.DBColumn + " = ?"

	if err := config.DB.Where(query, value).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, types.ErrorResponse{
			Error:   fieldConfig.ConflictError,
			Message: fieldConfig.ConflictMessage,
		})
		return
	}

	// Field is available
	response := gin.H{
		"message":               fieldConfig.SuccessMessage,
		fieldConfig.ResponseKey: value,
	}
	c.JSON(http.StatusOK, response)
}

// isValidEmail performs basic email validation
func isValidEmail(email string) bool {
	return strings.Contains(email, "@") && strings.Contains(email, ".")
}

// CheckEmail godoc
// @Summary      Check email availability
// @Description  Verify if an email address is available for registration
// @Tags         Authentication
// @Accept       json
// @Produce      json
// @Param        email body object{email=string} true "Email to check" example({"email": "user@example.com"})
// @Success      200 {object} object{message=string,email=string} "Email is available" example({"message": "Email is available", "email": "user@example.com"})
// @Failure      400 {object} types.ErrorResponse "Invalid request format or email format"
// @Failure      409 {object} types.ErrorResponse "Email already exists"
// @Router       /auth/check-email [post]
func (ac *AuthController) CheckEmail(c *gin.Context) {
	ac.handleFieldAvailabilityCheck(c, "email")
}

// CheckUsername godoc
// @Summary      Check username availability
// @Description  Verify if a username is available for registration
// @Tags         Authentication
// @Accept       json
// @Produce      json
// @Param        username body object{username=string} true "Username to check" example({"username": "johndoe"})
// @Success      200 {object} object{message=string,username=string} "Username is available" example({"message": "Username is available", "username": "johndoe"})
// @Failure      400 {object} types.ErrorResponse "Invalid request format"
// @Failure      409 {object} types.ErrorResponse "Username already exists"
// @Router       /auth/check-username [post]
func (ac *AuthController) CheckUsername(c *gin.Context) {
	ac.handleFieldAvailabilityCheck(c, "username")
}
