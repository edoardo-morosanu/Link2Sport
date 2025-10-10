"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { ProfilePost, ProfileActivity, UserProfile } from "@/types/profile";
import { AppHeader } from "@/components/profile/AppHeader";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { PostsTab } from "@/components/profile/PostsTab";
import { ActivitiesTab } from "@/components/profile/ActivitiesTab";
import { MediaTab } from "@/components/profile/MediaTab";
import { AllTab } from "@/components/profile/AllTab";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { FollowersModal, FollowingModal } from "@/components/Follow";

// Loading state component
function ProfileLoadingState() {
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

// Error state component
function ProfileErrorState({ error }: { error: string }) {
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
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

// Profile content component
function ProfileContent({
  profile,
  activeTab,
  setActiveTab,
  posts,
  activities,
  setIsEditModalOpen,
  setShowFollowersModal,
  setShowFollowingModal,
}: {
  profile: UserProfile;
  activeTab: "all" | "posts" | "activities" | "media";
  setActiveTab: (tab: "all" | "posts" | "activities" | "media") => void;
  posts: ProfilePost[];
  activities: ProfileActivity[];
  setIsEditModalOpen: (open: boolean) => void;
  setShowFollowersModal: (open: boolean) => void;
  setShowFollowingModal: (open: boolean) => void;
}) {
  const renderTabContent = () => {
    switch (activeTab) {
      case "all":
        return <AllTab />;
      case "posts":
        return <PostsTab posts={posts} profileName={profile.name} />;
      case "activities":
        return <ActivitiesTab activities={activities} />;
      case "media":
        return <MediaTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <AppHeader />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-colors duration-300">
          <ProfileHeader
            name={profile.name}
            username={profile.username}
            bio={profile.bio}
            followersCount={profile.followersCount}
            followingCount={profile.followingCount}
            activitiesCount={profile.activitiesCount}
            avatarUrl={profile.avatarUrl}
            hasAvatar={profile.hasAvatar}
            userId={profile.id}
            onEditProfile={() => setIsEditModalOpen(true)}
            onFollowersClick={() => setShowFollowersModal(true)}
            onFollowingClick={() => setShowFollowingModal(true)}
          />
          <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="p-6">{renderTabContent()}</div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const {
    profile,
    loading: profileLoading,
    error,
    updateProfile,
  } = useProfile();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<
    "all" | "posts" | "activities" | "media"
  >("all");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [activities, setActivities] = useState<ProfileActivity[]>([]);

  // Authentication check
  const shouldRedirectToLogin = !authLoading && !user;

  // Loading state check
  const isLoading = authLoading || profileLoading;

  // Data initialization
  const initializeMockData = (profile: UserProfile) => {
    setPosts([
      {
        id: "1",
        userId: profile.id,
        content: `Had an amazing ${profile.sports[0] || "sports"} session today! Thanks to everyone who joined.`,
        timestamp: new Date("2024-10-04"),
        likes: 15,
        comments: 3,
      },
    ]);

    setActivities([
      {
        id: "1",
        userId: profile.id,
        type: "game",
        sport: profile.sports[0] || "Basketball",
        title: `${profile.sports[0] || "Basketball"} Game`,
        description: `Friendly ${profile.sports[0] || "basketball"} match`,
        date: new Date("2024-10-04"),
        location: profile.location || "Local Court",
        participants: 8,
      },
    ]);
  };

  // Profile update handler
  const handleEditProfile = async (updatedProfile: Partial<UserProfile>) => {
    try {
      await updateProfile(updatedProfile);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  // Effects
  useEffect(() => {
    if (shouldRedirectToLogin) {
      router.push("/login");
    }
  }, [shouldRedirectToLogin, router]);

  useEffect(() => {
    if (profile) {
      initializeMockData(profile);
    }
  }, [profile]);

  // Early returns for different states
  if (isLoading) {
    return <ProfileLoadingState />;
  }

  if (error) {
    return <ProfileErrorState error={error} />;
  }

  if (!profile) {
    return null;
  }

  return (
    <>
      <ProfileContent
        profile={profile}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        posts={posts}
        activities={activities}
        setIsEditModalOpen={setIsEditModalOpen}
        setShowFollowersModal={setShowFollowersModal}
        setShowFollowingModal={setShowFollowingModal}
        router={router}
      />
      <EditProfileModal
        isOpen={isEditModalOpen}
        profile={profile}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditProfile}
      />

      <FollowersModal
        isOpen={showFollowersModal}
        userId={parseInt(profile.id)}
        onClose={() => setShowFollowersModal(false)}
        onUserClick={(user) => {
          setShowFollowersModal(false);
          router.push(`/user/${user.id}`);
        }}
        showFollowButtons={true}
      />

      <FollowingModal
        isOpen={showFollowingModal}
        userId={parseInt(profile.id)}
        onClose={() => setShowFollowingModal(false)}
        onUserClick={(user) => {
          setShowFollowingModal(false);
          router.push(`/user/${user.id}`);
        }}
        showFollowButtons={true}
      />
    </>
  );
}
