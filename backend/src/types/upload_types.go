package types

// UploadResponse represents the response for file upload operations
// @Description File upload response payload
type UploadResponse struct {
	Message   string `json:"message" example:"Avatar uploaded successfully" description:"Response message"`
	Success   bool   `json:"success" example:"true" description:"Whether the upload was successful"`
	AvatarURL string `json:"avatar_url,omitempty" example:"/api/user/12345/avatar" description:"URL to the uploaded avatar image"`
}

// FileUploadError represents file upload error responses
// @Description File upload error response payload
type FileUploadError struct {
	Error     string `json:"error" example:"Invalid file" description:"Error type or category"`
	Message   string `json:"message" example:"File size exceeds maximum limit of 5MB" description:"Detailed error message"`
	ErrorCode string `json:"error_code,omitempty" example:"FILE_TOO_LARGE" description:"Specific error code for client handling"`
}

// FileInfo represents basic file information
// @Description File information metadata
type FileInfo struct {
	OriginalName string `json:"original_name" example:"profile-picture.jpg" description:"Original filename as uploaded"`
	Size         int64  `json:"size" example:"1048576" description:"File size in bytes"`
	ContentType  string `json:"content_type" example:"image/jpeg" description:"MIME type of the file"`
	Extension    string `json:"extension" example:".jpg" description:"File extension"`
}
