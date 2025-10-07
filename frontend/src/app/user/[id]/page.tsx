"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { SearchService } from "@/services/search";
import { PublicUserProfile } from "@/types/search";
import { AppHeader } from "@/components/profile/AppHeader";
import PublicProfileHeader from "@/components/profile/PublicProfileHeader";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { PostsTab } from "@/components/profile/PostsTab";
import { ActivitiesTab } from "@/components/profile/ActivitiesTab";
import { MediaTab } from "@/components/profile/MediaTab";
import { ProfilePost, ProfileActivity } from "@/types/profile";

export default function UserProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"posts" | "activities" | "media">(
    "posts",
  );
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [activities, setActivities] = useState<ProfileActivity[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Redirect to own profile if viewing self
  useEffect(() => {
    if (user && userId === user.id) {
      router.push("/profile");
    }
  }, [user, userId, router]);

  // Fetch user profile
  useEffect(() => {
    async function fetchProfile() {
      if (!userId || !user) return;

      try {
        setLoading(true);
        setError(null);
        const userProfile = await SearchService.getUserProfile(
          parseInt(userId),
        );
        setProfile(userProfile);
        setIsFollowing(userProfile.is_following || false);
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        setError("Failed to load user profile");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [userId, user]);

  // Load mock data for posts and activities (replace with actual API calls later)
  useEffect(() => {
    if (profile) {
      setPosts([
        {
          id: "1",
          userId: profile.id.toString(),
          content: `Had an amazing ${profile.sports[0] || "sports"} session today! Great community here.`,
          timestamp: new Date("2024-10-04"),
          likes: 12,
          comments: 2,
        },
        {
          id: "2",
          userId: profile.id.toString(),
          content: "Looking forward to the next game! Who's in?",
          timestamp: new Date("2024-10-02"),
          likes: 8,
          comments: 5,
        },
      ]);

      setActivities([
        {
          id: "1",
          userId: profile.id.toString(),
          type: "game",
          sport: profile.sports[0] || "Basketball",
          title: `${profile.sports[0] || "Basketball"} Game`,
          description: `Friendly ${profile.sports[0] || "basketball"} match`,
          date: new Date("2024-10-06"),
          location: profile.city || "Local Court",
          participants: 6,
        },
      ]);
    }
  }, [profile]);

  const handleFollow = async () => {
    if (!profile) return;

    try {
      setFollowLoading(true);
      // TODO: Implement actual follow/unfollow API call
      // await FollowService.toggleFollow(profile.id);
      setIsFollowing(!isFollowing);
    } catch (err) {
      console.error("Failed to toggle follow:", err);
    } finally {
      setFollowLoading(false);
    }
  };

  const renderTabContent = () => {
    if (!profile) return null;

    switch (activeTab) {
      case "posts":
        return <PostsTab posts={posts} profileName={profile.display_name} />;
      case "activities":
        return <ActivitiesTab activities={activities} />;
      case "media":
        return <MediaTab />;
      default:
        return null;
    }
  };

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg
              className="h-12 w-12 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Profile
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if no profile data
  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <AppHeader />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-colors duration-300">
          <PublicProfileHeader
            profile={profile}
            isFollowing={isFollowing}
            followLoading={followLoading}
            onFollow={handleFollow}
          />

          <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="p-6">{renderTabContent()}</div>
        </div>
      </div>
    </div>
  );
}
