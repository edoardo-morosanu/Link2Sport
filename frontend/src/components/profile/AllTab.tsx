"use client";

import { useState } from "react";
import { ActivitiesTab } from "./ActivitiesTab";
import { CreateEventModal } from "@/components/events/CreateEventModal";
import { CreateEventData } from "@/types/event";
import { EventService } from "@/services/event";
import { useUserEvents } from "@/hooks/useEvents";

interface AllTabProps {
  // For future expansion when we add more content types
  className?: string;
}

export function AllTab({}: AllTabProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { refreshEvents } = useUserEvents();

  const handleCreateActivity = async (eventData: CreateEventData) => {
    try {
      await EventService.createEvent(eventData);
      refreshEvents();
      setShowCreateModal(false);
    } catch (error) {
      throw error; // Let the modal handle the error
    }
  };
  return (
    <div className="space-y-6">
      {/* Activity Creation Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              What&apos;s happening?
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Share activities, posts, and connect with your community
            </p>
          </div>
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Activity Card - This will have the modal */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="relative group w-full text-left"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative bg-gray-50/80 dark:bg-gray-700/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-600/30 hover:border-blue-300/60 dark:hover:border-blue-500/40 transition-all duration-200 group-hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Create Activity
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Organize sports events, games, and training sessions
              </p>
              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                Click to get started →
              </div>
            </div>
          </button>

          {/* Post Card - Placeholder for future */}
          <div className="relative group opacity-60">
            <div className="relative bg-gray-50/80 dark:bg-gray-700/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-600/30 transition-all duration-200">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Write Post
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Share thoughts, achievements, and updates
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-500 font-medium">
                Coming soon...
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Activities Tab */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Your Activities
            </h3>
          </div>
        </div>
        <div className="p-6">
          <ActivitiesTab showCreateSection={false} />
        </div>
      </div>

      {/* Create Activity Modal */}
      <CreateEventModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateActivity}
      />
    </div>
  );
}
