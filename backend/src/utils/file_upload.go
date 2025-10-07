package utils

import (
	"slices"
	"errors"
	"mime/multipart"
	"path/filepath"
	"strings"
)

const MaxFileSize = 5 * 1024 * 1024 // 5MB

var AllowedImageTypes = map[string]bool{
	"image/jpeg": true,
	"image/jpg":  true,
	"image/png":  true,
	"image/webp": true,
}

// ValidateImageFile validates if the uploaded file is a valid image
func ValidateImageFile(fileHeader *multipart.FileHeader) error {
	// Check file size
	if fileHeader.Size > MaxFileSize {
		return errors.New("file size exceeds 5MB limit")
	}

	// Check file extension
	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	validExtensions := []string{".jpg", ".jpeg", ".png", ".webp"}
	isValidExt := slices.Contains(validExtensions, ext)
	if !isValidExt {
		return errors.New("invalid file type. Only JPG, PNG, and WebP are allowed")
	}

	return nil
}

// GetContentTypeFromExtension returns MIME type based on file extension
func GetContentTypeFromExtension(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	switch ext {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".webp":
		return "image/webp"
	default:
		return "image/jpeg" // default fallback
	}
}

// GetFileExtensionFromContentType returns file extension based on MIME type
func GetFileExtensionFromContentType(contentType string) string {
	switch strings.ToLower(contentType) {
	case "image/jpeg":
		return ".jpg"
	case "image/png":
		return ".png"
	case "image/webp":
		return ".webp"
	default:
		return ".jpg" // default fallback
	}
}

// IsValidImageType checks if the content type is allowed
func IsValidImageType(contentType string) bool {
	return AllowedImageTypes[strings.ToLower(contentType)]
}
