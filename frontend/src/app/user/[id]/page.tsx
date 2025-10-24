"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { SearchService } from "@/services/search";
import { PublicUserProfile } from "@/types/search";
import { Event } from "@/types/event";
import { EventService } from "@/services/event";
import { eventToProfileActivity } from "@/types/profile";
import { AppHeader } from "@/components/profile/AppHeader";
import PublicProfileHeader from "@/components/profile/PublicProfileHeader";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { PostsTab } from "@/components/profile/PostsTab";
import { ActivitiesTab } from "@/components/profile/ActivitiesTab";
import { MediaTab } from "@/components/profile/MediaTab";
import { AllTab } from "@/components/profile/AllTab";
import { ProfilePost, ProfileActivity } from "@/types/profile";
import {
  FollowButton,
  FollowersModal,
  FollowingModal,
} from "@/components/Follow";
import { useUserPosts as useUserPostsHook } from "@/hooks/usePosts";

export default function UserProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "all" | "posts" | "activities" | "media"
  >("all");
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [activities, setActivities] = useState<ProfileActivity[]>([]);
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

  // Backend posts for this user
  const { posts: userPosts, loading: postsLoading, error: postsError, refreshPosts } = useUserPostsHook(userId);

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
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        setError("Failed to load user profile");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [userId, user]);

  // Map backend posts to ProfilePost
  useEffect(() => {
    if (userPosts && profile) {
      const mapped = userPosts.map((p) => ({
        id: p.id,
        userId: p.user_id,
        title: p.title,
        content: p.body,
        timestamp: p.created_at,
        images: p.image_url ? [p.image_url] : undefined,
        likes: 0,
        comments: 0,
        mentions: p.mentions || [],
      }))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setPosts(mapped);
    }
  }, [userPosts, profile]);

  // Fetch target user's events and map to activities
  useEffect(() => {
    async function fetchUserEvents() {
      if (!userId || !user) return;
      try {
        const evts = await EventService.getUserEventsById(userId);
        setUserEvents(evts);
        // Map events to ProfileActivity for ActivitiesTab
        const mapped = evts.map(eventToProfileActivity);
        setActivities(mapped);
      } catch (err) {
        console.error("Failed to fetch user events:", err);
        setUserEvents([]);
        setActivities([]);
      }
    }
    fetchUserEvents();
  }, [userId, user]);

  const handleFollowChange = (isFollowing: boolean) => {
    // Update the profile's follow status and counts
    if (profile) {
      setProfile({
        ...profile,
        is_following: isFollowing,
        followers_count: isFollowing
          ? profile.followers_count + 1
          : profile.followers_count - 1,
      });
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "all":
        return (
          <AllTab
            posts={userPosts}
            events={userEvents}
            showCreateSection={false}
          />
        );
      case "posts":
        return (
          <PostsTab
            posts={posts}
            profileName={profile?.display_name || profile?.username || ""}
          />
        );
      case "activities":
        return <ActivitiesTab activities={activities} />;
      case "media":
        return <MediaTab posts={posts} />;
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
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img
                    src={profile.has_avatar && profile.avatar_url
                      ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}${profile.avatar_url}`
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.username || profile.display_name || "User")}&size=200&background=3b82f6&color=fff`}
                    alt={`${profile.display_name}'s avatar`}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.onerror = null;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.username || profile.display_name || "User")}&size=200&background=3b82f6&color=fff`;
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {profile.display_name || profile.username}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                      @{profile.username}
                    </p>
                  </div>

                  {profile.bio && (
                    <p className="text-gray-700 dark:text-gray-300 max-w-md">
                      {profile.bio}
                    </p>
                  )}

                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    {profile.city && (
                      <span className="flex items-center">
                        📍 {profile.city}
                        {profile.country && `, ${profile.country}`}
                      </span>
                    )}
                    <span>
                      Joined {new Date(profile.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center space-x-6">
                    <button
                      onClick={() => setShowFollowersModal(true)}
                      className="text-sm hover:underline"
                    >
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {profile.followers_count}
                      </span>{" "}
                      <span className="text-gray-600 dark:text-gray-400">
                        Followers
                      </span>
                    </button>
                    <button
                      onClick={() => setShowFollowingModal(true)}
                      className="text-sm hover:underline"
                    >
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {profile.following_count}
                      </span>{" "}
                      <span className="text-gray-600 dark:text-gray-400">
                        Following
                      </span>
                    </button>
                  </div>

                  {profile.sports && profile.sports.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {profile.sports.map((sport, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                        >
                          {sport}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0">
                <FollowButton
                  userId={profile.id}
                  initialFollowStatus={profile.is_following}
                  onFollowChange={handleFollowChange}
                  size="medium"
                />
              </div>
            </div>
          </div>

          <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="p-6">{renderTabContent()}</div>
        </div>

        <FollowersModal
          isOpen={showFollowersModal}
          userId={profile.id}
          onClose={() => setShowFollowersModal(false)}
          onUserClick={(user) => {
            setShowFollowersModal(false);
            router.push(`/user/${user.id}`);
          }}
          showFollowButtons={true}
        />

        <FollowingModal
          isOpen={showFollowingModal}
          userId={profile.id}
          onClose={() => setShowFollowingModal(false)}
          onUserClick={(user) => {
            setShowFollowingModal(false);
            router.push(`/user/${user.id}`);
          }}
          showFollowButtons={true}
        />
      </div>
    </div>
  );
}
