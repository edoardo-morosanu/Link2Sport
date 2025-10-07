"use client";

import { useState, useRef, useCallback } from "react";
import { AvatarService } from "@/services/avatar";

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  hasCurrentAvatar?: boolean;
  onAvatarChange?: (file: File | null) => void;
  onUploadComplete?: (avatarUrl: string) => void;
  onDeleteComplete?: () => void;
  showUploadButton?: boolean;
  showDeleteButton?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AvatarUpload({
  currentAvatarUrl,
  hasCurrentAvatar = false,
  onAvatarChange,
  onUploadComplete,
  onDeleteComplete,
  showUploadButton = true,
  showDeleteButton = true,
  size = "md",
  className = "",
}: AvatarUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Size configurations
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  const buttonSizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file
    const validation = AvatarService.validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || "Invalid file");
      return;
    }

    // Clean up previous preview
    if (previewUrl) {
      AvatarService.revokePreviewUrl(previewUrl);
    }

    // Create new preview
    const newPreviewUrl = AvatarService.createPreviewUrl(file);
    setSelectedFile(file);
    setPreviewUrl(newPreviewUrl);

    // Notify parent component
    onAvatarChange?.(file);
  }, [previewUrl, onAvatarChange]);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      const result = await AvatarService.uploadAvatar(selectedFile);

      if (result.success && result.avatar_url) {
        onUploadComplete?.(result.avatar_url);
        // Clear selection after successful upload
        handleClearSelection();
      } else {
        setError(result.message || "Upload failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const result = await AvatarService.deleteAvatar();

      if (result.success) {
        onDeleteComplete?.();
      } else {
        setError(result.message || "Delete failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearSelection = () => {
    if (previewUrl) {
      AvatarService.revokePreviewUrl(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onAvatarChange?.(null);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  // Determine which image to show
  const displayImageUrl = previewUrl || currentAvatarUrl;
  const showPlaceholder = !displayImageUrl;

  return (
    <div className={`flex flex-col items-center space-y-3 ${className}`}>
      {/* Avatar Display */}
      <div className="relative group">
        <div
          className={`${sizeClasses[size]} rounded-full border-2 border-gray-200 dark:border-gray-600 overflow-hidden bg-gray-100 dark:bg-gray-700 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors duration-200`}
          onClick={handleAvatarClick}
        >
          {showPlaceholder ? (
            <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
              <svg className="w-1/2 h-1/2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.9 1 3 1.9 3 3V21C3 22.1 3.9 23 5 23H19C20.1 23 21 22.1 21 21V9M12 7C14.21 7 16 8.79 16 11C16 13.21 14.21 15 12 15C9.79 15 8 13.21 8 11C8 8.79 9.79 7 12 7Z" />
              </svg>
            </div>
          ) : (
            <img
              src={displayImageUrl}
              alt="Avatar"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to placeholder on error
                e.currentTarget.style.display = "none";
              }}
            />
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>

        {/* Selection indicator */}
        {selectedFile && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap justify-center">
        {selectedFile && showUploadButton && (
          <>
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
              className={`${buttonSizeClasses[size]} bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors duration-200 flex items-center gap-1`}
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Upload...
                </>
              ) : (
                "Upload"
              )}
            </button>
            <button
              type="button"
              onClick={handleClearSelection}
              disabled={isUploading}
              className={`${buttonSizeClasses[size]} border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200`}
            >
              Cancel
            </button>
          </>
        )}

        {!selectedFile && hasCurrentAvatar && showDeleteButton && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className={`${buttonSizeClasses[size]} border border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg transition-colors duration-200 flex items-center gap-1`}
          >
            {isDeleting ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deleting...
              </>
            ) : (
              "Remove"
            )}
          </button>
        )}

        {!selectedFile && !showUploadButton && (
          <button
            type="button"
            onClick={handleAvatarClick}
            className={`${buttonSizeClasses[size]} border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200`}
          >
            Choose Photo
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm text-center max-w-xs">
          {error}
        </p>
      )}

      {/* File info */}
      {selectedFile && (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-xs">
          <p>{selectedFile.name}</p>
          <p>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
      )}
    </div>
  );
}
