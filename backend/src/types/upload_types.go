package types

// UploadResponse represents the response for file upload operations
type UploadResponse struct {
	Message   string `json:"message"`
	Success   bool   `json:"success"`
	AvatarURL string `json:"avatar_url,omitempty"`
}

// FileUploadError represents file upload error responses
type FileUploadError struct {
	Error     string `json:"error"`
	Message   string `json:"message"`
	ErrorCode string `json:"error_code,omitempty"`
}

// FileInfo represents basic file information
type FileInfo struct {
	OriginalName string `json:"original_name"`
	Size         int64  `json:"size"`
	ContentType  string `json:"content_type"`
	Extension    string `json:"extension"`
}
