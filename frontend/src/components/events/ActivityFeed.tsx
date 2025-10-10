"use client";

import { useState } from "react";
import { useEvents } from "@/hooks/useEvents";
import { useEventStatusUpdater } from "@/hooks/useEventStatusUpdater";
import { CreateEventData, EventFilters, EventType } from "@/types/event";
import { EventService } from "@/services/event";
import { DateTimePicker } from "@/components/ui";

export function ActivityFeed() {
  const { events, loading, error, refreshEvents, joinEvent, leaveEvent } =
    useEvents();

  // Auto status updater
  const { forceUpdate } = useEventStatusUpdater({
    enabled: true,
    pollInterval: 60000, // Check every minute
    onStatusUpdate: (count) => {
      if (count > 0) {
        console.log(`${count} events had status updates`);
        // Refresh events to show updated statuses
        refreshEvents();
      }
    },
    onError: (error) => {
      console.error("Status update error:", error);
    },
  });

  // Composer state
  const [isComposerExpanded, setIsComposerExpanded] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [composerData, setComposerData] = useState({
    type: "game" as const,
    title: "",
    description: "",
    sport: "",
    start_at: null as Date | null,
    end_at: null as Date | null,
    location_name: "",
    capacity: "",
  });

  // Join/Leave state
  const [joiningEventId, setJoiningEventId] = useState<string | null>(null);
  const [leavingEventId, setLeavingEventId] = useState<string | null>(null);

  const resetComposer = () => {
    setComposerData({
      type: "game" as const,
      title: "",
      description: "",
      sport: "",
      start_at: null,
      end_at: null,
      location_name: "",
      capacity: "",
    });
    setIsComposerExpanded(false);
    setCreateError(null);
  };

  const handleCreateActivity = async () => {
    if (
      !composerData.title.trim() ||
      !composerData.sport.trim() ||
      !composerData.location_name.trim() ||
      !composerData.start_at
    ) {
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const eventData: CreateEventData = {
        type: composerData.type,
        title: composerData.title,
        description: composerData.description,
        sport: composerData.sport,
        start_at: composerData.start_at!,
        end_at: composerData.end_at || undefined,
        location_name: composerData.location_name,
        latitude: 0,
        longitude: 0,
        capacity: composerData.capacity
          ? parseInt(composerData.capacity)
          : undefined,
      };

      await EventService.createEvent(eventData);
      refreshEvents();
      resetComposer();
    } catch (error) {
      setCreateError(
        error instanceof Error ? error.message : "Failed to create activity",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinEvent = async (eventId: string) => {
    try {
      setJoiningEventId(eventId);
      await joinEvent(eventId);
    } catch (error) {
      console.error("Failed to join event:", error);
      alert("Failed to join activity. Please try again.");
    } finally {
      setJoiningEventId(null);
    }
  };

  const handleLeaveEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to leave this activity?")) {
      return;
    }

    try {
      setLeavingEventId(eventId);
      await leaveEvent(eventId);
    } catch (error) {
      console.error("Failed to leave event:", error);
      alert("Failed to leave activity. Please try again.");
    } finally {
      setLeavingEventId(null);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
    } else if (diffDays === 1) {
      return `Tomorrow at ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
    } else if (diffDays < 7) {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const getEventTypeEmoji = (type: string) => {
    switch (type) {
      case "game":
        return "Game";
      case "training":
        return "Training";
      case "event":
        return "Event";
      default:
        return "Event";
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "upcoming":
        return {
          label: "Upcoming",
          color:
            "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300",
          icon: "⏰",
        };
      case "active":
        return {
          label: "Active Now",
          color:
            "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300",
          icon: "🟢",
        };
      case "complete":
        return {
          label: "Completed",
          color:
            "bg-gray-100 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300",
          icon: "✅",
        };
      default:
        return {
          label: "Unknown",
          color:
            "bg-gray-100 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300",
          icon: "❓",
        };
    }
  };

  const canJoinEvent = (event: any) => {
    return (
      !event.is_organizer &&
      !event.is_participant &&
      event.status === "upcoming" &&
      (!event.capacity || event.participants < event.capacity)
    );
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse space-y-6">
          {/* Composer skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
          {/* Event skeletons */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-red-500 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Failed to load activities
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={refreshEvents}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Twitter-style Composer */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        {!isComposerExpanded ? (
          <button
            onClick={() => setIsComposerExpanded(true)}
            className="w-full p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-xl"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
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
                <div className="text-xl text-gray-500 dark:text-gray-400 font-light">
                  What sport activity are you organizing?
                </div>
              </div>
            </div>
          </button>
        ) : (
          <div className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                <svg
                  className="w-6 h-6 text-white"
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

              <div className="flex-1 space-y-4">
                {createError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm">
                    {createError}
                  </div>
                )}

                {/* Activity Type Pills */}
                <div className="flex space-x-2">
                  {[
                    { value: "game", label: "Game", desc: "Competitive" },
                    {
                      value: "training",
                      label: "Training",
                      desc: "Practice",
                    },
                    { value: "event", label: "Event", desc: "Social" },
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() =>
                        setComposerData({
                          ...composerData,
                          type: type.value as any,
                        })
                      }
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        composerData.type === type.value
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>

                {/* Main Input */}
                <textarea
                  placeholder="What's happening? Describe your activity..."
                  value={composerData.title}
                  onChange={(e) =>
                    setComposerData({ ...composerData, title: e.target.value })
                  }
                  className="w-full text-xl placeholder-gray-500 dark:placeholder-gray-400 bg-transparent border-none resize-none focus:outline-none text-gray-900 dark:text-white"
                  rows={2}
                  autoFocus
                />

                {/* Expanded Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Sport (e.g., Basketball)"
                    value={composerData.sport}
                    onChange={(e) =>
                      setComposerData({
                        ...composerData,
                        sport: e.target.value,
                      })
                    }
                    className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />

                  <input
                    type="text"
                    placeholder="Location"
                    value={composerData.location_name}
                    onChange={(e) =>
                      setComposerData({
                        ...composerData,
                        location_name: e.target.value,
                      })
                    }
                    className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />

                  <input
                    type="number"
                    placeholder="Max participants"
                    value={composerData.capacity}
                    onChange={(e) =>
                      setComposerData({
                        ...composerData,
                        capacity: e.target.value,
                      })
                    }
                    className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    min="2"
                  />
                </div>

                {/* Date and Time Pickers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DateTimePicker
                    value={composerData.start_at}
                    onChange={(date) =>
                      setComposerData({
                        ...composerData,
                        start_at: date,
                      })
                    }
                    label="Start Date & Time"
                  />

                  <DateTimePicker
                    value={composerData.end_at}
                    onChange={(date) =>
                      setComposerData({
                        ...composerData,
                        end_at: date,
                      })
                    }
                    label="End Date & Time (Optional)"
                  />
                </div>

                <textarea
                  placeholder="Add more details..."
                  value={composerData.description}
                  onChange={(e) =>
                    setComposerData({
                      ...composerData,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                  rows={2}
                />

                {/* Action Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={resetComposer}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium"
                    disabled={isCreating}
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleCreateActivity}
                    disabled={
                      isCreating ||
                      !composerData.title.trim() ||
                      !composerData.sport.trim() ||
                      !composerData.start_at
                    }
                    className="px-6 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2 shadow-lg"
                  >
                    {isCreating && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                    <span>{isCreating ? "Creating..." : "Share Activity"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Activities Feed */}
      <div className="space-y-4">
        {events.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No activities yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Be the first to organize a sports activity in your community!
            </p>
            <button
              onClick={() => setIsComposerExpanded(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
            >
              Create First Activity
            </button>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200"
            >
              {/* Event Header */}
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                  {event.organizer_avatar ? (
                    <img
                      src={event.organizer_avatar}
                      alt={event.organizer_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                      {event.organizer_name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {/* User info and time */}
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {event.organizer_name}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      @{event.organizer_username}
                    </span>
                    <span className="text-gray-400">·</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      {formatDate(event.start_at)}
                    </span>
                    {event.is_organizer && (
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                        You
                      </span>
                    )}
                  </div>

                  {/* Event content */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">
                        {getEventTypeEmoji(event.type)}
                      </span>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {event.title}
                      </h2>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-full">
                        {event.sport}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusDisplay(event.status).color}`}
                      >
                        {getStatusDisplay(event.status).icon}{" "}
                        {getStatusDisplay(event.status).label}
                      </span>
                    </div>

                    {event.description && (
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {event.description}
                      </p>
                    )}

                    {/* Event details card */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
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
                        </svg>
                        {event.location_name}
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
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
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        {event.participants} participant
                        {event.participants !== 1 ? "s" : ""}
                        {event.capacity && ` of ${event.capacity}`}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center space-x-3 pt-2">
                      {canJoinEvent(event) && (
                        <button
                          onClick={() => handleJoinEvent(event.id)}
                          disabled={joiningEventId === event.id}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-all shadow-lg"
                        >
                          {joiningEventId === event.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <svg
                              className="w-4 h-4"
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
                          )}
                          <span>
                            {joiningEventId === event.id
                              ? "Joining..."
                              : "Join"}
                          </span>
                        </button>
                      )}

                      {!event.is_participant &&
                        !event.is_organizer &&
                        event.status !== "upcoming" && (
                          <span className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-sm font-medium">
                            {event.status === "active"
                              ? "Event in Progress"
                              : "Event Ended"}
                          </span>
                        )}

                      {event.is_participant &&
                        !event.is_organizer &&
                        event.status === "upcoming" && (
                          <button
                            onClick={() => handleLeaveEvent(event.id)}
                            disabled={leavingEventId === event.id}
                            className="flex items-center space-x-2 px-4 py-2 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-full hover:bg-red-200 dark:hover:bg-red-900/70 disabled:opacity-50 text-sm font-medium transition-all"
                          >
                            {leavingEventId === event.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                            ) : (
                              <svg
                                className="w-4 h-4"
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
                            )}
                            <span>
                              {leavingEventId === event.id
                                ? "Leaving..."
                                : "Leave"}
                            </span>
                          </button>
                        )}

                      {event.is_participant && event.status !== "upcoming" && (
                        <span className="flex items-center space-x-2 px-4 py-2 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span>
                            {event.status === "active"
                              ? "Participating Now"
                              : "Participated"}
                          </span>
                        </span>
                      )}

                      {event.is_participant && event.status === "upcoming" && (
                        <span className="flex items-center space-x-2 px-4 py-2 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span>Participating</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
