import { AuthService } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface AvatarUploadResponse {
  success: boolean;
  message: string;
  avatar_url?: string;
  error?: string;
}

export class AvatarService {
  // Upload avatar image
  static async uploadAvatar(file: File): Promise<AvatarUploadResponse> {
    const token = AuthService.getToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch(`${API_BASE_URL}/api/upload/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          AuthService.logout();
          throw new Error("Authentication expired. Please login again.");
        }

        let errorMessage = "Upload failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          console.error("Failed to parse error response:", e);
        }

        return {
          success: false,
          message: errorMessage,
        };
      }

      const data = await response.json();
      return {
        success: true,
        message: data.message || "Avatar uploaded successfully",
        avatar_url: data.avatar_url,
      };
    } catch (error) {
      console.error("Avatar upload error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Network error. Please try again.",
      };
    }
  }

  // Delete current avatar
  static async deleteAvatar(): Promise<AvatarUploadResponse> {
    const token = AuthService.getToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/upload/avatar`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          AuthService.logout();
          throw new Error("Authentication expired. Please login again.");
        }

        let errorMessage = "Delete failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          console.error("Failed to parse error response:", e);
        }

        return {
          success: false,
          message: errorMessage,
        };
      }

      const data = await response.json();
      return {
        success: true,
        message: data.message || "Avatar deleted successfully",
      };
    } catch (error) {
      console.error("Avatar delete error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Network error. Please try again.",
      };
    }
  }

  // Generate avatar URL for a user
  static getAvatarUrl(userId: string | number): string {
    return `${API_BASE_URL}/api/user/${userId}/avatar`;
  }

  // Validate image file before upload
  static validateImageFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (file.size > maxSize) {
      return {
        valid: false,
        error: "File size must be less than 5MB",
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: "Only JPG, PNG, and WebP images are allowed",
      };
    }

    return { valid: true };
  }

  // Create preview URL for selected file
  static createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  // Clean up preview URL
  static revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  }
}
