"use client";

import { AvatarService } from "@/services/avatar";
import { PublicUserProfile } from "@/types/search";

interface PublicProfileHeaderProps {
  profile: PublicUserProfile;
  isFollowing: boolean;
  followLoading: boolean;
  onFollow: () => void;
}

// Avatar component
function ProfileAvatar({
  userId,
  hasAvatar,
  displayName,
}: {
  userId: number;
  hasAvatar: boolean;
  displayName: string;
}) {
  return (
    <div className="flex-shrink-0">
      <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 mx-auto sm:mx-0 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {hasAvatar ? (
          <img
            src={AvatarService.getAvatarUrl(userId)}
            alt={`${displayName}'s avatar`}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.onerror = null;
              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || "User")}&size=200&background=3b82f6&color=fff`;
            }}
          />
        ) : (
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || "User")}&size=200&background=3b82f6&color=fff`}
            alt={`${displayName}'s avatar`}
            className="w-full h-full object-cover"
          />
        )}
      </div>
    </div>
  );
}

// Basic profile info component
function ProfileBasicInfo({ profile }: { profile: PublicUserProfile }) {
  return (
    <div className="mb-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        {profile.display_name}
      </h1>
      <p className="text-gray-600 dark:text-gray-400">@{profile.username}</p>
    </div>
  );
}

// Bio component
function ProfileBio({ bio }: { bio?: string }) {
  if (!bio) return null;

  return (
    <p className="text-gray-700 dark:text-gray-300 mb-4 max-w-md">{bio}</p>
  );
}

// Location component
function ProfileLocation({
  city,
  country,
}: {
  city?: string;
  country?: string;
}) {
  if (!city && !country) return null;

  return (
    <div className="flex items-center justify-center sm:justify-start mb-4 text-gray-600 dark:text-gray-400">
      <svg
        className="w-4 h-4 mr-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
      <span>{[city, country].filter(Boolean).join(", ")}</span>
    </div>
  );
}

// Sports component
function ProfileSports({ sports }: { sports?: string[] }) {
  if (!sports || sports.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
      {sports.map((sport, index) => (
        <span
          key={index}
          className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium"
        >
          {sport}
        </span>
      ))}
    </div>
  );
}

// Stats component
function ProfileStats() {
  const stats = [
    { label: "Posts", value: 0 },
    { label: "Followers", value: 0 },
    { label: "Following", value: 0 },
    { label: "Activities", value: 0 },
  ];

  return (
    <div className="flex justify-center sm:justify-start gap-6 mb-4 text-sm">
      {stats.map(({ label, value }) => (
        <div key={label} className="text-center">
          <div className="font-semibold text-gray-900 dark:text-white">
            {value}
          </div>
          <div className="text-gray-600 dark:text-gray-400">{label}</div>
        </div>
      ))}
    </div>
  );
}

// Follow button component
function FollowButton({
  isFollowing,
  followLoading,
  onFollow,
}: {
  isFollowing: boolean;
  followLoading: boolean;
  onFollow: () => void;
}) {
  const getButtonClasses = () => {
    const baseClasses =
      "px-6 py-2 rounded-lg font-medium transition-colors duration-200";
    const followingClasses =
      "bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500";
    const notFollowingClasses = "bg-blue-600 text-white hover:bg-blue-700";
    const loadingClasses = "opacity-50 cursor-not-allowed";
    const normalClasses = "cursor-pointer";

    return `${baseClasses} ${isFollowing ? followingClasses : notFollowingClasses} ${followLoading ? loadingClasses : normalClasses}`;
  };

  const getButtonContent = () => {
    if (followLoading) {
      return (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></div>
          Loading...
        </div>
      );
    }
    return isFollowing ? "Following" : "Follow";
  };

  return (
    <div className="flex-shrink-0">
      <button
        onClick={onFollow}
        disabled={followLoading}
        className={getButtonClasses()}
      >
        {getButtonContent()}
      </button>
    </div>
  );
}

// Member since component
function MemberSince({ createdAt }: { createdAt: string }) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center sm:text-left">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Member since {formatDate(createdAt)}
      </p>
    </div>
  );
}

export function PublicProfileHeader({
  profile,
  isFollowing,
  followLoading,
  onFollow,
}: PublicProfileHeaderProps) {
  return (
    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row gap-6">
        <ProfileAvatar
          userId={profile.id}
          hasAvatar={profile.has_avatar}
          displayName={profile.display_name}
        />

        <div className="flex-1 text-center sm:text-left">
          <ProfileBasicInfo profile={profile} />
          <ProfileBio bio={profile.bio} />
          <ProfileLocation city={profile.city} country={profile.country} />
          <ProfileSports sports={profile.sports} />
          <ProfileStats />
        </div>

        <FollowButton
          isFollowing={isFollowing}
          followLoading={followLoading}
          onFollow={onFollow}
        />
      </div>

      <MemberSince createdAt={profile.created_at} />
    </div>
  );
}

export default PublicProfileHeader;
