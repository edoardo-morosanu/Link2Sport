import { AuthService } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface AvatarUploadResponse {
  success: boolean;
  message: string;
  avatar_url?: string;
  error?: string;
}

export class AvatarService {
  private static validateAuthentication(): string {
    const token = AuthService.getToken();
    if (!token) {
      throw new Error("No authentication token found");
    }
    return token;
  }

  private static async parseErrorResponse(
    response: Response,
    defaultMessage: string,
  ): Promise<string> {
    try {
      const errorData = await response.json();
      return errorData.message || errorData.error || defaultMessage;
    } catch (e) {
      console.error("Failed to parse error response:", e);
      return defaultMessage;
    }
  }

  private static async handleErrorResponse(
    response: Response,
    defaultMessage: string,
  ): Promise<AvatarUploadResponse> {
    if (response.status === 401) {
      AuthService.logout();
      throw new Error("Authentication expired. Please login again.");
    }

    const errorMessage = await this.parseErrorResponse(
      response,
      defaultMessage,
    );
    return {
      success: false,
      message: errorMessage,
    };
  }

  private static createSuccessResponse(
    data: { message?: string; avatar_url?: string },
    defaultMessage: string,
  ): AvatarUploadResponse {
    return {
      success: true,
      message: data.message || defaultMessage,
      avatar_url: data.avatar_url,
    };
  }

  private static handleCatchError(
    error: unknown,
    operation: string,
  ): AvatarUploadResponse {
    console.error(`Avatar ${operation} error:`, error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Network error. Please try again.",
    };
  }

  private static async makeAvatarRequest(
    method: string,
    body?: FormData,
    contentType?: string,
  ): Promise<Response> {
    const token = this.validateAuthentication();

    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
    };

    if (contentType) {
      headers["Content-Type"] = contentType;
    }

    const response = await fetch(`${API_BASE_URL}/api/upload/avatar`, {
      method,
      headers,
      body,
      credentials: "include",
    });

    return response;
  }

  // Upload avatar image
  static async uploadAvatar(file: File): Promise<AvatarUploadResponse> {
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await this.makeAvatarRequest("POST", formData);

      if (!response.ok) {
        return await this.handleErrorResponse(response, "Upload failed");
      }

      const data = await response.json();
      return this.createSuccessResponse(data, "Avatar uploaded successfully");
    } catch (error) {
      return this.handleCatchError(error, "upload");
    }
  }

  // Delete current avatar
  static async deleteAvatar(): Promise<AvatarUploadResponse> {
    try {
      const response = await this.makeAvatarRequest(
        "DELETE",
        undefined,
        "application/json",
      );

      if (!response.ok) {
        return await this.handleErrorResponse(response, "Delete failed");
      }

      const data = await response.json();
      return this.createSuccessResponse(data, "Avatar deleted successfully");
    } catch (error) {
      return this.handleCatchError(error, "delete");
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
