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
    <div className="p-4 sm:p-6 border-b border-[var(--border-color)] transition-colors duration-300">
      <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-6 gap-4 sm:gap-0">
        {/* Profile Picture */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[var(--card-hover-bg)] rounded-full border-4 border-[var(--card-bg)] shadow-md overflow-hidden transition-colors duration-300">
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
          <div className="flex items-start sm:items-center justify-between mb-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] transition-colors duration-300">
              {name}
            </h1>
            <button
              onClick={onEditProfile}
              className="hidden sm:inline-block px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200"
            >
              Edit Profile
            </button>
          </div>
          <p className="text-[var(--text-muted)] text-sm mb-2 transition-colors duration-300">
            @{username}
          </p>

          {/* Stats */}
          <div className="flex items-center justify-between sm:justify-start sm:space-x-6 mb-4">
            <button
              onClick={onFollowersClick}
              className="text-center hover:bg-[var(--card-hover-bg)] px-2 py-1.5 rounded-md transition-colors cursor-pointer"
            >
              <div className="text-lg sm:text-xl font-bold text-[var(--text-primary)] transition-colors duration-300">
                {followersCount}
              </div>
              <div className="text-xs sm:text-sm text-[var(--text-muted)] transition-colors duration-300">
                followers
              </div>
            </button>
            <button
              onClick={onFollowingClick}
              className="text-center hover:bg-[var(--card-hover-bg)] px-2 py-1.5 rounded-md transition-colors cursor-pointer"
            >
              <div className="text-lg sm:text-xl font-bold text-[var(--text-primary)] transition-colors duration-300">
                {followingCount}
              </div>
              <div className="text-xs sm:text-sm text-[var(--text-muted)] transition-colors duration-300">
                following
              </div>
            </button>
            <button
              type="button"
              className="text-center px-2 py-1.5 rounded-md transition-colors cursor-default"
            >
              <div className="text-lg sm:text-xl font-bold text-[var(--text-primary)] transition-colors duration-300">
                {activitiesCount}
              </div>
              <div className="text-xs sm:text-sm text-[var(--text-muted)] transition-colors duration-300">
                activities
              </div>
            </button>
          </div>

          {/* Bio */}
          {bio && (
            <p className="text-[var(--text-secondary)] text-sm mb-3 transition-colors duration-300">
              {bio}
            </p>
          )}

          {/* Mobile Edit button */}
          <button
            onClick={onEditProfile}
            className="sm:hidden w-full mt-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200"
          >
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
}
