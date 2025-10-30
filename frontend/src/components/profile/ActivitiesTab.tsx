"use client";

import { useEffect, useState } from "react";
import { useUserEvents } from "@/hooks/useEvents";
import { CreateEventData } from "@/types/event";
import { EventService } from "@/services/event";
import { CreateEventModal } from "@/components/events/CreateEventModal";
import { ProfileActivity } from "@/types/profile";
import { useRouter } from "next/navigation";

interface ActivitiesTabProps {
  activities?: ProfileActivity[]; // Keep for backward compatibility if needed
  showCreateSection?: boolean; // Whether to show the activity creation section
  onCreateActivity?: () => void; // External handler for opening create modal
}

export function ActivitiesTab({
  activities,
  showCreateSection = false,
  onCreateActivity,
}: ActivitiesTabProps) {
  const { events, loading, error, refreshEvents } = useUserEvents();
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const router = useRouter();
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [eventMetaMap, setEventMetaMap] = useState<Record<string, { is_participant: boolean; is_organizer: boolean; status: string; participants: number; capacity?: number }>>({});

  // Modal state for creating activities
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreateActivity = async (eventData: CreateEventData) => {
    try {
      await EventService.createEvent(eventData);
      refreshEvents();
    } catch (error) {
      throw error; // Let the modal handle the error
    }
  };

  // Load participation meta for provided activities (public profile view)
  useEffect(() => {
    if (!activities || activities.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const results = await Promise.allSettled(
          activities.map((a) => EventService.getEvent(a.id))
        );
        const map: Record<string, { is_participant: boolean; is_organizer: boolean; status: string; participants: number; capacity?: number }> = {};
        results.forEach((res, idx) => {
          const id = activities[idx].id;
          if (res.status === "fulfilled" && res.value) {
            const e = res.value as any;
            map[id] = {
              is_participant: !!e.is_participant,
              is_organizer: !!e.is_organizer,
              status: e.status,
              participants: e.participants,
              capacity: e.capacity,
            };
          }
        });
        if (!cancelled) setEventMetaMap(map);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [activities]);

  const canJoin = (meta?: { is_participant: boolean; is_organizer: boolean; status: string; participants: number; capacity?: number }) => {
    if (!meta) return false;
    return !meta.is_organizer && !meta.is_participant && meta.status === "upcoming" && (typeof meta.capacity !== "number" || meta.participants < (meta.capacity || 0));
  };

  const canLeave = (meta?: { is_participant: boolean; is_organizer: boolean; status: string }) => {
    if (!meta) return false;
    return meta.is_participant && !meta.is_organizer && meta.status !== "complete";
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this activity? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      setDeletingEventId(eventId);
      await EventService.deleteEvent(eventId);
      refreshEvents();
    } catch (error) {
      console.error("Failed to delete event:", error);
      alert("Failed to delete activity. Please try again.");
    } finally {
      setDeletingEventId(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getEventTypeDisplay = (type: string) => {
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200";
      case "active":
        return "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200";
      case "complete":
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
      case "cancelled":
        return "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Loading activities...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={refreshEvents}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Activity Creation Button - Only show if not embedded */}
        {showCreateSection && (
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-600 dark:text-blue-400"
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
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  Create New Activity
                </h3>
                <p className="text-sm text-[var(--text-muted)]">
                  Share a sports activity with the community
                </p>
              </div>
            </div>

            <button
              onClick={onCreateActivity || (() => setShowCreateModal(true))}
              className="w-full p-4 text-left bg-[var(--card-hover-bg)] rounded-lg border-2 border-dashed border-[var(--border-color)] hover:border-blue-400 hover:bg-[var(--card-bg)] transition-colors"
            >
              <p className="text-[var(--text-muted)]">
                What activity are you organizing? Click to get started...
              </p>
            </button>
          </div>
        )}

        {/* Activities List */}
        <div className="space-y-4">
          {/* If activities are provided (e.g., viewing other users), render those */}
          {Array.isArray(activities) && activities.length > 0 ? (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-6 transition-all duration-200 hover:shadow-md cursor-pointer"
                onClick={() => router.push(`/activity/${activity.id}`)}
                title="Open activity"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="font-semibold text-xl text-[var(--text-primary)]">
                        {activity.title}
                      </h3>
                      <span className="text-sm px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full capitalize">
                        {activity.type}
                      </span>
                    </div>
                    <p className="text-base text-blue-600 dark:text-blue-400 mb-2 font-medium">
                      {activity.sport}
                    </p>
                    {activity.description && (
                      <p className="text-sm text-[var(--text-secondary)] mb-3 leading-relaxed">
                        {activity.description}
                      </p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-[var(--text-muted)] mb-3">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1m-6 0a2 2 0 002 2h4a2 2 0 002-2m-6 0h6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2z" />
                        </svg>
                        <span>{new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(activity.date)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{activity.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {canLeave(eventMetaMap[activity.id]) && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          setJoinError(null);
                          try {
                            setJoiningId(activity.id);
                            await EventService.leaveEvent(activity.id);
                            setEventMetaMap((m) => ({
                              ...m,
                              [activity.id]: {
                                ...m[activity.id],
                                is_participant: false,
                                participants: Math.max(0, (m[activity.id]?.participants || 1) - 1),
                              },
                            }));
                          } catch (err) {
                            setJoinError(err instanceof Error ? err.message : "Failed to leave activity");
                          } finally {
                            setJoiningId(null);
                          }
                        }}
                        disabled={joiningId === activity.id}
                        className="px-3 py-1 text-xs rounded-md border border-[var(--border-color)] hover:bg-[var(--card-hover-bg)] text-[var(--text-secondary)] disabled:opacity-60"
                        title="Leave activity"
                      >
                        {joiningId === activity.id ? "Leaving..." : "Leave"}
                      </button>
                    )}
                    {canJoin(eventMetaMap[activity.id]) && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          setJoinError(null);
                          try {
                            setJoiningId(activity.id);
                            await EventService.joinEvent(activity.id);
                            setEventMetaMap((m) => ({
                              ...m,
                              [activity.id]: {
                                ...m[activity.id],
                                is_participant: true,
                                participants: (m[activity.id]?.participants || 0) + 1,
                              },
                            }));
                          } catch (err) {
                            setJoinError(err instanceof Error ? err.message : "Failed to join activity");
                          } finally {
                            setJoiningId(null);
                          }
                        }}
                        disabled={joiningId === activity.id}
                        className="px-3 py-1 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                        title="Join activity"
                      >
                        {joiningId === activity.id ? "Joining..." : "Join"}
                      </button>
                    )}
                  </div>
                </div>
                {joinError && (
                  <div className="mt-2 text-sm text-red-600">{joinError}</div>
                )}
              </div>
            ))
          ) : !events || events.length === 0 ? (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <h4 className="text-lg font-semibold mb-2">No activities yet</h4>
              <p className="mb-4">
                Create your first activity using the composer above!
              </p>
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-6 transition-all duration-200 hover:shadow-md cursor-pointer"
                onClick={() => router.push(`/activity/${event.id}`)}
                title="Open activity"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header with title and badges */}
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="font-semibold text-xl text-[var(--text-primary)]">
                        {event.title}
                      </h3>
                      <span className="text-sm px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full">
                        {getEventTypeDisplay(event.type)}
                      </span>
                      <span
                        className={`text-sm px-3 py-1 rounded-full ${getStatusBadgeColor(event.status)}`}
                      >
                        {event.status.charAt(0).toUpperCase() +
                          event.status.slice(1)}
                      </span>
                    </div>

                    {/* Sport */}
                    <p className="text-base text-blue-600 dark:text-blue-400 mb-2 font-medium">
                      {event.sport}
                    </p>

                    {/* Description */}
                    {event.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                        {event.description}
                      </p>
                    )}

                    {/* Event details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-500 dark:text-gray-400 mb-3">
                      <div className="flex items-center space-x-2">
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
                            d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1m-6 0a2 2 0 002 2h4a2 2 0 002-2m-6 0h6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2z"
                          />
                        </svg>
                        <span>{formatDate(event.start_at)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
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
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span>{event.location_name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
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
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        <span>
                          {event.participants}
                          {event.capacity ? `/${event.capacity}` : ""}{" "}
                          participants
                        </span>
                      </div>
                    </div>

                    {event.end_at && (
                      <div className="flex items-center space-x-2 text-sm text-[var(--text-muted)] mb-3">
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
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Ends: {formatDate(event.end_at)}</span>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event.id); }}
                      disabled={deletingEventId === event.id}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete activity"
                    >
                      {deletingEventId === event.id ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                      ) : (
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Activity Modal - Only render if not externally controlled */}
      {showCreateSection && (
        <CreateEventModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateActivity}
        />
      )}
    </>
  );
}
