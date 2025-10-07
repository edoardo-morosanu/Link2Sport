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
}: ProfileHeaderProps) {
  return (
    <div className="p-6 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div className="flex items-start space-x-6">
        {/* Profile Picture */}
        <div className="w-24 h-24 bg-gray-200 dark:bg-gray-600 rounded-full border-4 border-white dark:border-gray-800 shadow-md overflow-hidden transition-colors duration-300">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${name}'s avatar`}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to default avatar on error
                e.currentTarget.style.display = "none";
                e.currentTarget.parentElement!.innerHTML = `
                  <div class="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-600">
                    <svg class="w-12 h-12 text-gray-400 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                `;
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-gray-400 dark:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          )}
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
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                {followersCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                followers
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                {followingCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                following
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                {activitiesCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                activities
              </div>
            </div>
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
