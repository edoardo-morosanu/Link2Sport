import { useState, useEffect, useCallback } from "react";
import { EventService } from "@/services/event";
import {
  Event,
  EventWithOrganizer,
  CreateEventData,
  UpdateEventData,
  EventFilters,
} from "@/types/event";

export function useEvents(filters?: EventFilters) {
  const [events, setEvents] = useState<EventWithOrganizer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const eventsData = await EventService.getEvents(filters);
      console.log(
        "fetchEvents - API URL:",
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/events/`,
      );
      console.log("fetchEvents - filters:", filters);
      console.log("fetchEvents - received data:", eventsData);
      console.log("fetchEvents - data type:", typeof eventsData);
      console.log(
        "fetchEvents - data length:",
        Array.isArray(eventsData) ? eventsData.length : "N/A",
      );

      // Ensure we always have an array
      if (Array.isArray(eventsData)) {
        console.log(
          "fetchEvents - setting events array with",
          eventsData.length,
          "items",
        );
        setEvents(eventsData);
      } else {
        console.warn("fetchEvents - received non-array data:", eventsData);
        setEvents([]);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch events");
      setEvents([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const createEvent = async (eventData: CreateEventData): Promise<Event> => {
    try {
      console.log("createEvent - creating with data:", eventData);
      const newEvent = await EventService.createEvent(eventData);
      console.log("createEvent - created event:", newEvent);
      await fetchEvents(); // Refresh the list
      return newEvent;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create event";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateEvent = async (
    eventId: string,
    eventData: UpdateEventData,
  ): Promise<void> => {
    try {
      await EventService.updateEvent(eventId, eventData);
      await fetchEvents(); // Refresh the list
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update event";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteEvent = async (eventId: string): Promise<void> => {
    try {
      await EventService.deleteEvent(eventId);
      fetchEvents(); // Refresh the list
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete event";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const joinEvent = async (eventId: string): Promise<void> => {
    try {
      await EventService.joinEvent(eventId);
      fetchEvents(); // Refresh the list
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to join event";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const leaveEvent = async (eventId: string): Promise<void> => {
    try {
      await EventService.leaveEvent(eventId);
      fetchEvents(); // Refresh the list
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to leave event";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    events,
    loading,
    error,
    refreshEvents: fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    joinEvent,
    leaveEvent,
  };
}

export function useUserEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const eventsData = await EventService.getUserEvents();
      console.log(
        "fetchUserEvents - API URL:",
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/events/my`,
      );
      console.log("fetchUserEvents - received data:", eventsData);
      console.log("fetchUserEvents - data type:", typeof eventsData);
      console.log(
        "fetchUserEvents - data length:",
        Array.isArray(eventsData) ? eventsData.length : "N/A",
      );

      // Ensure we always have an array
      if (Array.isArray(eventsData)) {
        console.log(
          "fetchUserEvents - setting events array with",
          eventsData.length,
          "items",
        );
        setEvents(eventsData);
      } else {
        console.warn("fetchUserEvents - received non-array data:", eventsData);
        setEvents([]);
      }
    } catch (err) {
      console.error("Error fetching user events:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch user events",
      );
      setEvents([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserEvents();
  }, [fetchUserEvents]);

  return {
    events,
    loading,
    error,
    refreshEvents: fetchUserEvents,
  };
}

export function useEvent(eventId: string) {
  const [event, setEvent] = useState<EventWithOrganizer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvent = useCallback(async () => {
    if (!eventId) return;

    try {
      setLoading(true);
      setError(null);
      const eventData = await EventService.getEvent(eventId);
      setEvent(eventData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch event");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  return {
    event,
    loading,
    error,
    refreshEvent: fetchEvent,
  };
}
