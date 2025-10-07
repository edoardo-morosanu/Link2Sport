import { useState, useRef, useEffect } from "react";
import { UserProfile } from "@/types/profile";
import { AvatarUpload } from "@/components/ui/AvatarUpload";
import { AvatarService } from "@/services/avatar";

interface EditProfileModalProps {
  isOpen: boolean;
  profile: UserProfile;
  onClose: () => void;
  onSave: (updatedProfile: Partial<UserProfile>) => Promise<void>;
}

export function EditProfileModal({
  isOpen,
  profile,
  onClose,
  onSave,
}: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    name: profile.name,
    bio: profile.bio || "",
    location: profile.location || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  // Mouse tracking for subtle hover effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (modalRef.current) {
        const rect = modalRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setMousePosition({ x, y });
      }
    };

    if (isOpen) {
      document.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Update profile info first
      await onSave(formData);

      // Upload avatar if selected
      if (avatarFile) {
        setAvatarUploading(true);
        try {
          await AvatarService.uploadAvatar(avatarFile);
        } catch (avatarError) {
          console.error("Avatar upload failed:", avatarError);
          // Don't fail the whole operation for avatar upload
        } finally {
          setAvatarUploading(false);
        }
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading && !avatarUploading) {
      setFormData({
        name: profile.name,
        bio: profile.bio || "",
        location: profile.location || "",
      });
      setError(null);
      setAvatarFile(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      {/* Subtle animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-blue-400/5 to-purple-600/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-tr from-teal-400/5 to-blue-600/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-md w-full">
        {/* Main glass container */}
        <div
          ref={modalRef}
          className="relative bg-white/85 dark:bg-gray-800/85 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6 transition-all duration-300 animate-in slide-in-from-bottom-8"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(59, 130, 246, 0.02), transparent 50%)`,
          }}
        >
          {/* Subtle inner gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/3 via-transparent to-blue-500/1 dark:from-gray-700/3 dark:to-purple-500/1 rounded-2xl pointer-events-none"></div>

          {/* Content */}
          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">
                Edit Profile
              </h2>

              <button
                onClick={handleClose}
                disabled={isLoading || avatarUploading}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100/50 dark:hover:bg-gray-700/30 rounded-lg"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 bg-red-50/90 dark:bg-red-900/30 backdrop-blur-sm border border-red-200/50 dark:border-red-800/50 rounded-xl p-3 animate-in slide-in-from-top-2 duration-300">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                  {error}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Avatar Upload Section */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                  Profile Picture
                </label>
                <div className="flex justify-center">
                  <div className="hover:bg-gray-50/30 dark:hover:bg-gray-700/20 rounded-xl p-3 transition-all duration-200">
                    <AvatarUpload
                      currentAvatarUrl={profile.avatarUrl}
                      hasCurrentAvatar={profile.hasAvatar}
                      onAvatarChange={setAvatarFile}
                      showUploadButton={false}
                      showDeleteButton={true}
                      size="lg"
                      className="justify-center"
                    />
                  </div>
                </div>
              </div>

              {/* Name Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-gray-50/70 dark:bg-gray-700/30 backdrop-blur-sm border-2 border-gray-200/50 dark:border-gray-600/30 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-300/60 dark:hover:border-gray-500/40 hover:bg-gray-50/90 dark:hover:bg-gray-700/40"
                  required
                />
              </div>

              {/* Bio Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  rows={3}
                  placeholder="Tell us about yourself..."
                  className="w-full px-4 py-3 bg-gray-50/70 dark:bg-gray-700/30 backdrop-blur-sm border-2 border-gray-200/50 dark:border-gray-600/30 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed resize-none hover:border-gray-300/60 dark:hover:border-gray-500/40 hover:bg-gray-50/90 dark:hover:bg-gray-700/40 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              {/* Location Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  placeholder="City, Country"
                  className="w-full px-4 py-3 bg-gray-50/70 dark:bg-gray-700/30 backdrop-blur-sm border-2 border-gray-200/50 dark:border-gray-600/30 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-300/60 dark:hover:border-gray-500/40 hover:bg-gray-50/90 dark:hover:bg-gray-700/40 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                {/* Cancel Button */}
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading || avatarUploading}
                  className="flex-1 px-4 py-3 bg-gray-50/70 dark:bg-gray-700/30 backdrop-blur-sm border-2 border-gray-200/50 dark:border-gray-600/30 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-700/50 hover:border-gray-300/60 dark:hover:border-gray-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium transform hover:scale-[1.01] active:scale-[0.99]"
                >
                  Cancel
                </button>

                {/* Save Button */}
                <button
                  type="submit"
                  disabled={isLoading || avatarUploading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600/90 to-blue-700/90 hover:from-blue-700 hover:to-blue-800 backdrop-blur-sm text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium transform hover:scale-[1.01] active:scale-[0.99] shadow-md hover:shadow-lg"
                >
                  {isLoading || avatarUploading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {avatarUploading ? "Uploading..." : "Saving..."}
                    </>
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
