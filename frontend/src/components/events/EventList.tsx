"use client";

import { useState } from "react";
import { useEvents } from "@/hooks/useEvents";
import { EventWithOrganizer, EventFilters, EventType } from "@/types/event";
import { EventService } from "@/services/event";

interface EventListProps {
  showFilters?: boolean;
  showJoinActions?: boolean;
  initialFilters?: EventFilters;
}

export function EventList({
  showFilters = true,
  showJoinActions = true,
  initialFilters,
}: EventListProps) {
  const [filters, setFilters] = useState<EventFilters>(initialFilters || {});
  const { events, loading, error, refreshEvents, joinEvent, leaveEvent } =
    useEvents(filters);

  const [joiningEventId, setJoiningEventId] = useState<string | null>(null);
  const [leavingEventId, setLeavingEventId] = useState<string | null>(null);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "text-blue-600 dark:text-blue-400";
      case "active":
        return "text-green-600 dark:text-green-400";
      case "complete":
        return "text-gray-600 dark:text-gray-400";
      case "cancelled":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
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

  const canJoinEvent = (event: EventWithOrganizer) => {
    return (
      !event.is_organizer &&
      !event.is_participant &&
      event.status === "upcoming" &&
      (!event.capacity || event.participants < event.capacity)
    );
  };

  const canLeaveEvent = (event: EventWithOrganizer) => {
    return event.is_participant && !event.is_organizer;
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
    <div className="space-y-6">
      {/* Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Filter Activities
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sport Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sport
              </label>
              <input
                type="text"
                value={filters.sport || ""}
                onChange={(e) => {
                  const newFilters = {
                    ...filters,
                    sport: e.target.value || undefined,
                  };
                  setFilters(newFilters);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Basketball"
              />
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
              </label>
              <select
                value={filters.type || ""}
                onChange={(e) => {
                  const newFilters = {
                    ...filters,
                    type: (e.target.value as EventType) || undefined,
                  };
                  setFilters(newFilters);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Types</option>
                <option value="game">Games</option>
                <option value="training">Training</option>
                <option value="event">Events</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => setFilters({})}
                className="w-full px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Events List */}
      <div className="space-y-4">
        {events.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <div className="mb-4">
              <svg
                className="w-16 h-16 mx-auto text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2z"
                />
              </svg>
            </div>
            <h4 className="text-lg font-semibold mb-2">No activities found</h4>
            <p>
              Try adjusting your filters or check back later for new activities!
            </p>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header with title, badges, and organizer */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-semibold text-xl text-gray-900 dark:text-white">
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
                  </div>

                  {/* Organizer info */}
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      {event.organizer_avatar ? (
                        <img
                          src={event.organizer_avatar}
                          alt={event.organizer_name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {event.organizer_name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {event.organizer_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        @{event.organizer_username}
                      </p>
                    </div>
                    {event.is_organizer && (
                      <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 rounded-full">
                        Organizer
                      </span>
                    )}
                  </div>

                  {/* Sport */}
                  <p className="text-base text-blue-600 dark:text-blue-400 mb-2 font-medium">
                    {event.sport}
                  </p>

                  {/* Description */}
                  {event.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                      {event.description}
                    </p>
                  )}

                  {/* Event details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-500 dark:text-gray-400 mb-4">
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
                    {event.end_at && (
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
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Ends: {formatDate(event.end_at)}</span>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  {showJoinActions && (
                    <div className="flex space-x-2">
                      {canJoinEvent(event) && (
                        <button
                          onClick={() => handleJoinEvent(event.id)}
                          disabled={joiningEventId === event.id}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2"
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

                      {canLeaveEvent(event) && (
                        <button
                          onClick={() => handleLeaveEvent(event.id)}
                          disabled={leavingEventId === event.id}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2"
                        >
                          {leavingEventId === event.id ? (
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

                      {event.is_participant && !canLeaveEvent(event) && (
                        <span className="px-4 py-2 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 rounded-lg flex items-center space-x-2">
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

                      {event.status !== "upcoming" && (
                        <span className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg">
                          {event.status === "complete"
                            ? "Completed"
                            : event.status === "active"
                              ? "In Progress"
                              : event.status === "cancelled"
                                ? "Cancelled"
                                : "Unknown"}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
