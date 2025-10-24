import { AuthService } from "./auth";
import {
  Event,
  EventWithOrganizer,
  CreateEventData,
  UpdateEventData,
  EventFilters,
  EventParticipant,
} from "@/types/event";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export class EventService {
  private static validateAuthentication(): string {
    const token = AuthService.getToken();
    if (!token) {
      throw new Error("No authentication token found");
    }
    return token;
  }

  private static createHeaders(token: string): HeadersInit {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  private static async handleResponse(response: Response): Promise<any> {
    if (!response.ok) {
      if (response.status === 401) {
        AuthService.logout();
        throw new Error("Authentication expired. Please login again.");
      }

      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Request failed with status ${response.status}`,
      );
    }

    if (response.status === 204) {
      return null; // No content
    }

    return await response.json();
  }

  private static async makeAuthenticatedRequest(
    url: string,
    options: RequestInit,
  ): Promise<any> {
    const token = this.validateAuthentication();

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...this.createHeaders(token),
        ...options.headers,
      },
      credentials: "include",
    };

    try {
      const response = await fetch(url, requestOptions);
      return await this.handleResponse(response);
    } catch (error) {
      console.error("API request error:", error);
      throw error;
    }
  }

  private static mapEventResponse(event: any): Event {
    return {
      id: event.id?.toString() || "",
      organizer_id: event.organizer_id?.toString() || "",
      type: event.type,
      title: event.title || "",
      description: event.description || "",
      sport: event.sport || "",
      start_at: new Date(event.start_at),
      end_at: event.end_at ? new Date(event.end_at) : undefined,
      location_name: event.location_name || "",
      latitude: event.latitude || 0,
      longitude: event.longitude || 0,
      capacity: event.capacity,
      participants: event.participants || 0,
      status: event.status,
      created_at: new Date(event.created_at),
      updated_at: new Date(event.updated_at),
    };
  }

  private static mapEventWithOrganizerResponse(event: any): EventWithOrganizer {
    return {
      ...this.mapEventResponse(event),
      organizer_name: event.organizer_name || "",
      organizer_username: event.organizer_username || "",
      organizer_avatar: event.organizer_avatar
        ? `${API_BASE_URL}${event.organizer_avatar}`
        : undefined,
      is_organizer: event.is_organizer || false,
      is_participant: event.is_participant || false,
    };
  }

  // Create a new event
  static async createEvent(eventData: CreateEventData): Promise<Event> {
    const response = await this.makeAuthenticatedRequest(
      `${API_BASE_URL}/api/events/`,
      {
        method: "POST",
        body: JSON.stringify(eventData),
      },
    );

    return this.mapEventResponse(response);
  }

  // Get all events with optional filtering
  static async getEvents(
    filters?: EventFilters,
  ): Promise<EventWithOrganizer[]> {
    const queryParams = new URLSearchParams();

    if (filters?.sport) queryParams.append("sport", filters.sport);
    if (filters?.type) queryParams.append("type", filters.type);
    if (filters?.limit) queryParams.append("limit", filters.limit.toString());
    if (filters?.offset)
      queryParams.append("offset", filters.offset.toString());

    const url = `${API_BASE_URL}/api/events/${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

    const response = await this.makeAuthenticatedRequest(url, {
      method: "GET",
    });

    // Handle null/undefined response
    if (!response || !Array.isArray(response)) {
      return [];
    }
    return response.map((event: any) =>
      this.mapEventWithOrganizerResponse(event),
    );
  }

  // Get current user's events
  static async getUserEvents(): Promise<Event[]> {
    const response = await this.makeAuthenticatedRequest(
      `${API_BASE_URL}/api/events/my`,
      {
        method: "GET",
      },
    );

    // Handle null/undefined response
    if (!response || !Array.isArray(response)) {
      return [];
    }
    return response.map((event: any) => this.mapEventResponse(event));
  }

  // Get events by organizer (user) ID
  static async getUserEventsById(userId: string | number): Promise<Event[]> {
    const response = await this.makeAuthenticatedRequest(
      `${API_BASE_URL}/api/events/user/${userId}`,
      {
        method: "GET",
      },
    );

    if (!response || !Array.isArray(response)) {
      return [];
    }
    return response.map((event: any) => this.mapEventResponse(event));
  }

  // Get specific event by ID
  static async getEvent(eventId: string): Promise<EventWithOrganizer> {
    const response = await this.makeAuthenticatedRequest(
      `${API_BASE_URL}/api/events/${eventId}`,
      {
        method: "GET",
      },
    );

    return this.mapEventWithOrganizerResponse(response);
  }

  // Update an event
  static async updateEvent(
    eventId: string,
    eventData: UpdateEventData,
  ): Promise<Event> {
    const response = await this.makeAuthenticatedRequest(
      `${API_BASE_URL}/api/events/${eventId}`,
      {
        method: "PUT",
        body: JSON.stringify(eventData),
      },
    );

    return this.mapEventResponse(response);
  }

  // Delete an event
  static async deleteEvent(eventId: string): Promise<void> {
    await this.makeAuthenticatedRequest(
      `${API_BASE_URL}/api/events/${eventId}`,
      {
        method: "DELETE",
      },
    );
  }

  // Join an event
  static async joinEvent(eventId: string): Promise<void> {
    await this.makeAuthenticatedRequest(
      `${API_BASE_URL}/api/events/${eventId}/join`,
      {
        method: "POST",
      },
    );
  }

  // Leave an event
  static async leaveEvent(eventId: string): Promise<void> {
    await this.makeAuthenticatedRequest(
      `${API_BASE_URL}/api/events/${eventId}/leave`,
      {
        method: "DELETE",
      },
    );
  }

  // Get event participants
  static async getEventParticipants(
    eventId: string,
  ): Promise<EventParticipant[]> {
    const response = await this.makeAuthenticatedRequest(
      `${API_BASE_URL}/api/events/${eventId}/participants`,
      {
        method: "GET",
      },
    );

    // Handle null/undefined response
    if (!response || !Array.isArray(response)) {
      return [];
    }

    return response.map((participant: any) => {
      const user = participant.User || participant.user || {};
      const username = participant.username || user.username || "";
      const displayName =
        participant.name || user.display_name || user.username || username || "";
      const avatarPath = participant.avatar_url || user.avatar_url;
      return {
        id: participant.id?.toString() || "",
        event_id: participant.event_id?.toString() || "",
        user_id: participant.user_id?.toString() || "",
        role: participant.role || "",
        joined_at: new Date(participant.joined_at),
        username,
        name: displayName,
        avatar: avatarPath ? `${API_BASE_URL}${avatarPath}` : undefined,
      } as EventParticipant;
    });
  }

  // Force update event statuses
  static async updateEventStatuses(): Promise<void> {
    await this.makeAuthenticatedRequest(
      `${API_BASE_URL}/api/events/update-statuses`,
      {
        method: "POST",
      },
    );
  }

  // Get events needing status updates
  static async getEventsNeedingUpdate(): Promise<Event[]> {
    const response = await this.makeAuthenticatedRequest(
      `${API_BASE_URL}/api/events/needing-update`,
      {
        method: "GET",
      },
    );

    // Handle null/undefined response
    if (!response || !Array.isArray(response)) {
      return [];
    }
    return response.map((event: any) => this.mapEventResponse(event));
  }

  // Check if events need status updates and return count
  static async checkEventsNeedingUpdate(): Promise<number> {
    try {
      const events = await this.getEventsNeedingUpdate();
      return events.length;
    } catch (error) {
      console.error("Error checking events needing update:", error);
      return 0;
    }
  }
}
