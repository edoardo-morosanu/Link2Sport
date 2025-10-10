package types

// RegisterRequest represents the request payload for user registration
// @Description User registration request payload
type RegisterRequest struct {
	Email           string   `json:"email" binding:"required,email" example:"user@example.com" validate:"required,email" description:"User's email address"`
	Password        string   `json:"password" binding:"required,min=8" example:"securePassword123!" validate:"required,min=8" description:"User's password (minimum 8 characters)"`
	ConfirmPassword string   `json:"confirm_password" binding:"required" example:"securePassword123!" validate:"required" description:"Password confirmation (must match password)"`
	FirstName       string   `json:"first_name" binding:"required" example:"John" validate:"required" description:"User's first name"`
	LastName        string   `json:"last_name" binding:"required" example:"Doe" validate:"required" description:"User's last name"`
	Username        string   `json:"username" binding:"required" example:"johndoe" validate:"required" description:"Unique username"`
	Location        string   `json:"location" binding:"required" example:"New York, NY" validate:"required" description:"User's location/city"`
	Sports          []string `json:"sports" binding:"required,min=1" example:"[\"football\",\"basketball\"]" validate:"required,min=1" description:"List of sports user is interested in"`
	Bio             string   `json:"bio" example:"I love playing sports and meeting new people!" description:"Optional user biography"`
}

// LoginRequest represents the request payload for user login
// @Description User login request payload
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email" example:"user@example.com" validate:"required,email" description:"User's email address"`
	Password string `json:"password" binding:"required" example:"securePassword123!" validate:"required" description:"User's password"`
}

// AuthResponse represents the response for authentication operations
// @Description Authentication response payload
type AuthResponse struct {
	Message string `json:"message" example:"Login successful" description:"Response message"`
	Token   string `json:"token,omitempty" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." description:"JWT authentication token (only provided on login)"`
	UserID  uint   `json:"user_id,omitempty" example:"12345" description:"User's unique identifier"`
}

// ErrorResponse represents error response structure
// @Description Error response payload
type ErrorResponse struct {
	Error   string `json:"error" example:"Invalid credentials" description:"Error type or category"`
	Message string `json:"message" example:"Email or password is incorrect" description:"Detailed error message"`
}

// SuccessResponse represents general success response structure
// @Description General success response payload
type SuccessResponse struct {
	Message string `json:"message" example:"Operation completed successfully" description:"Success message"`
}
