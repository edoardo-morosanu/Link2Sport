"use client";

import { PublicUserProfile } from "@/types/search";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface PublicProfileHeaderProps {
  profile: PublicUserProfile;
  isFollowing: boolean;
  followLoading: boolean;
  onFollow: () => void;
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
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 mx-auto sm:mx-0 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        {/* Profile Info */}
        <div className="flex-1 text-center sm:text-left">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {profile.display_name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              @{profile.username}
            </p>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-gray-700 dark:text-gray-300 mb-4 max-w-md">
              {profile.bio}
            </p>
          )}

          {/* Location */}
          {(profile.city || profile.country) && (
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
              <span>
                {[profile.city, profile.country].filter(Boolean).join(", ")}
              </span>
            </div>
          )}

          {/* Sports */}
          {profile.sports && profile.sports.length > 0 && (
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
              {profile.sports.map((sport, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium"
                >
                  {sport}
                </span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="flex justify-center sm:justify-start gap-6 mb-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-gray-900 dark:text-white">
                0
              </div>
              <div className="text-gray-600 dark:text-gray-400">Posts</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900 dark:text-white">
                0
              </div>
              <div className="text-gray-600 dark:text-gray-400">Followers</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900 dark:text-white">
                0
              </div>
              <div className="text-gray-600 dark:text-gray-400">Following</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900 dark:text-white">
                0
              </div>
              <div className="text-gray-600 dark:text-gray-400">Activities</div>
            </div>
          </div>
        </div>

        {/* Follow Button */}
        <div className="flex-shrink-0">
          <button
            onClick={onFollow}
            disabled={followLoading}
            className={`px-6 py-2 rounded-lg font-medium transition-colors duration-200 ${
              isFollowing
                ? "bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
                : "bg-blue-600 text-white hover:bg-blue-700"
            } ${
              followLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            {followLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></div>
                Loading...
              </div>
            ) : isFollowing ? (
              "Following"
            ) : (
              "Follow"
            )}
          </button>
        </div>
      </div>

      {/* Member Since */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center sm:text-left">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Member since{" "}
          {new Date(profile.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
          })}
        </p>
      </div>
    </div>
  );
}

export default PublicProfileHeader;
