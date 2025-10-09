import { useState, useEffect } from "react";
import { ProfileService } from "@/services/profile";
import { AvatarService } from "@/services/avatar";
import { UserProfile } from "@/types/profile";
import { ApiProfileResponse } from "@/types/auth";
import { useAuth } from "@/contexts/AuthContext";

interface UseProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

export const useProfile = (): UseProfileReturn => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const transformApiResponse = (apiProfile: any): UserProfile => {
    return {
      id: apiProfile.id?.toString() || "",
      username: apiProfile.username || "",
      name:
        apiProfile.name || apiProfile.display_name || apiProfile.username || "",
      email: apiProfile.email || "",
      bio: apiProfile.bio || "",
      location: apiProfile.location || "",
      followersCount: apiProfile.followersCount || 0,
      followingCount: apiProfile.followingCount || 0,
      activitiesCount: apiProfile.activitiesCount || 0,
      sports: apiProfile.sports || [],
      avatarUrl:
        apiProfile.avatarUrl ||
        (apiProfile.has_avatar
          ? AvatarService.getAvatarUrl(apiProfile.id)
          : undefined),
      hasAvatar: apiProfile.hasAvatar || false,
    };
  };

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const profileData = await ProfileService.getProfile();
      const transformedProfile = transformApiResponse(profileData);
      setProfile(transformedProfile);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch profile";
      setError(errorMessage);

      // If authentication error, logout user
      if (errorMessage.includes("Authentication expired")) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    try {
      setError(null);

      // Transform frontend profile data to API format
      const apiUpdateData = {
        display_name: data.name,
        bio: data.bio,
        city: data.location?.split(",")[0]?.trim(),
        country: data.location?.split(",")[1]?.trim(),
        sports: data.sports,
      };

      await ProfileService.updateProfile(apiUpdateData);

      // Refetch profile to get updated data
      await fetchProfile();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update profile";
      setError(errorMessage);
      throw err; // Re-throw so components can handle it
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  return {
    profile,
    loading,
    error,
    refetchProfile: fetchProfile,
    updateProfile,
  };
};
