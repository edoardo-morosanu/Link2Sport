import { AvatarService } from "@/services/avatar";

interface ProfileHeaderProps {
  name: string;
  username: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
  activitiesCount: number;
  avatarUrl?: string;
  hasAvatar?: boolean;
  userId?: string;
  onEditProfile: () => void;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
}

export function ProfileHeader({
  name,
  username,
  bio,
  followersCount,
  followingCount,
  activitiesCount,
  avatarUrl,
  hasAvatar = false,
  userId,
  onEditProfile,
  onFollowersClick,
  onFollowingClick,
}: ProfileHeaderProps) {
  return (
    <div className="p-6 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div className="flex items-start space-x-6">
        {/* Profile Picture */}
        <div className="w-24 h-24 bg-gray-200 dark:bg-gray-600 rounded-full border-4 border-white dark:border-gray-800 shadow-md overflow-hidden transition-colors duration-300">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={hasAvatar && userId ? AvatarService.getAvatarUrl(userId) : `https://ui-avatars.com/api/?name=${encodeURIComponent(username || name || "User")}&size=200&background=3b82f6&color=fff`}
            alt={`${name}'s avatar`}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.onerror = null;
              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(username || name || "User")}&size=200&background=3b82f6&color=fff`;
            }}
          />
        </div>

        {/* Profile Info */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
              {name}
            </h1>
            <button
              onClick={onEditProfile}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200"
            >
              Edit Profile
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-1 transition-colors duration-300">
            @{username}
          </p>

          {/* Stats */}
          <div className="flex space-x-6 mb-4">
            <button
              onClick={onFollowersClick}
              className="text-center hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-md transition-colors cursor-pointer"
            >
              <div className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                {followersCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                followers
              </div>
            </button>
            <button
              onClick={onFollowingClick}
              className="text-center hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-md transition-colors cursor-pointer"
            >
              <div className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                {followingCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                following
              </div>
            </button>
            <button
              type="button"
              className="text-center p-2 rounded-md transition-colors cursor-default"
            >
              <div className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                {activitiesCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                activities
              </div>
            </button>
          </div>

          {/* Bio */}
          {bio && (
            <p className="text-gray-700 dark:text-gray-300 text-sm mb-3 transition-colors duration-300">
              {bio}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
