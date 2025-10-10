package types

import "time"

// EventType represents the type of event/activity
type EventType string

const (
	EventTypeGame     EventType = "game"
	EventTypeEvent    EventType = "event"
	EventTypeTraining EventType = "training"
)

// EventStatus represents the status of an event
type EventStatus string

const (
	EventStatusUpcoming  EventStatus = "upcoming"
	EventStatusActive    EventStatus = "active"
	EventStatusComplete  EventStatus = "complete"
	EventStatusCancelled EventStatus = "cancelled"
)

// CreateEventRequest represents the request for creating an event
// @Description Event creation request payload
type CreateEventRequest struct {
	Type         EventType  `json:"type" validate:"required,oneof=game event training" example:"game" description:"Type of event"`
	Title        string     `json:"title" validate:"required,min=3,max=255" example:"Friday Basketball Game" description:"Event title"`
	Description  string     `json:"description" validate:"max=1000" example:"Friendly basketball match at the local court" description:"Event description"`
	Sport        string     `json:"sport" validate:"required,min=2,max=100" example:"Basketball" description:"Sport name"`
	StartAt      time.Time  `json:"start_at" validate:"required" example:"2024-12-20T18:00:00Z" description:"Event start date and time"`
	EndAt        *time.Time `json:"end_at,omitempty" example:"2024-12-20T20:00:00Z" description:"Optional event end date and time"`
	LocationName string     `json:"location_name" validate:"required,min=3,max=255" example:"Central Park Basketball Court" description:"Event location name"`
	Latitude     float64    `json:"latitude" validate:"required" example:"40.7829" description:"Location latitude"`
	Longitude    float64    `json:"longitude" validate:"required" example:"-73.9654" description:"Location longitude"`
	Capacity     *int       `json:"capacity,omitempty" validate:"omitempty,min=2,max=1000" example:"10" description:"Maximum number of participants"`
}

// UpdateEventRequest represents the request for updating an event
// @Description Event update request payload
type UpdateEventRequest struct {
	Type         *EventType `json:"type,omitempty" validate:"omitempty,oneof=game event training" example:"game" description:"Updated event type"`
	Title        *string    `json:"title,omitempty" validate:"omitempty,min=3,max=255" example:"Friday Basketball Game" description:"Updated event title"`
	Description  *string    `json:"description,omitempty" validate:"omitempty,max=1000" example:"Friendly basketball match" description:"Updated event description"`
	Sport        *string    `json:"sport,omitempty" validate:"omitempty,min=2,max=100" example:"Basketball" description:"Updated sport name"`
	StartAt      *time.Time `json:"start_at,omitempty" example:"2024-12-20T18:00:00Z" description:"Updated event start time"`
	EndAt        *time.Time `json:"end_at,omitempty" example:"2024-12-20T20:00:00Z" description:"Updated event end time"`
	LocationName *string    `json:"location_name,omitempty" validate:"omitempty,min=3,max=255" example:"Central Park" description:"Updated location name"`
	Latitude     *float64   `json:"latitude,omitempty" example:"40.7829" description:"Updated latitude"`
	Longitude    *float64   `json:"longitude,omitempty" example:"-73.9654" description:"Updated longitude"`
	Capacity     *int       `json:"capacity,omitempty" validate:"omitempty,min=2,max=1000" example:"10" description:"Updated capacity"`
}

// EventResponse represents the response for event operations
// @Description Event response payload
type EventResponse struct {
	ID           uint        `json:"id" example:"1" description:"Event unique identifier"`
	OrganizerID  uint        `json:"organizer_id" example:"12345" description:"Organizer's user ID"`
	Type         EventType   `json:"type" example:"game" description:"Type of event"`
	Title        string      `json:"title" example:"Friday Basketball Game" description:"Event title"`
	Description  string      `json:"description" example:"Friendly basketball match" description:"Event description"`
	Sport        string      `json:"sport" example:"Basketball" description:"Sport name"`
	StartAt      time.Time   `json:"start_at" example:"2024-12-20T18:00:00Z" description:"Event start time"`
	EndAt        *time.Time  `json:"end_at,omitempty" example:"2024-12-20T20:00:00Z" description:"Event end time"`
	LocationName string      `json:"location_name" example:"Central Park Basketball Court" description:"Location name"`
	Latitude     float64     `json:"latitude" example:"40.7829" description:"Location latitude"`
	Longitude    float64     `json:"longitude" example:"-73.9654" description:"Location longitude"`
	Capacity     *int        `json:"capacity,omitempty" example:"10" description:"Maximum participants"`
	Participants int         `json:"participants" example:"5" description:"Current number of participants"`
	Status       EventStatus `json:"status" example:"upcoming" description:"Event status"`
	CreatedAt    time.Time   `json:"created_at" example:"2024-01-15T10:30:00Z" description:"Creation timestamp"`
	UpdatedAt    time.Time   `json:"updated_at" example:"2024-01-20T14:45:00Z" description:"Last update timestamp"`
}

// EventWithOrganizerResponse represents an event with organizer information
// @Description Event with organizer information response payload
type EventWithOrganizerResponse struct {
	EventResponse
	OrganizerName     string  `json:"organizer_name" example:"John Doe" description:"Organizer's display name"`
	OrganizerUsername string  `json:"organizer_username" example:"johndoe" description:"Organizer's username"`
	OrganizerAvatar   *string `json:"organizer_avatar,omitempty" example:"/api/user/12345/avatar" description:"Organizer's avatar URL"`
	IsOrganizer       bool    `json:"is_organizer" example:"false" description:"Whether current user is the organizer"`
	IsParticipant     bool    `json:"is_participant" example:"true" description:"Whether current user is participating"`
}

// CalculateEventStatus determines the appropriate status based on current time and event times
func CalculateEventStatus(startAt time.Time, endAt *time.Time) EventStatus {
	now := time.Now()

	if now.Before(startAt) {
		return EventStatusUpcoming
	}

	if endAt != nil && now.After(*endAt) {
		return EventStatusComplete
	}

	return EventStatusActive
}

// JoinEventRequest represents the request to join an event
// @Description Join event request payload
type JoinEventRequest struct {
	EventID uint `json:"event_id" validate:"required" example:"1" description:"Event ID to join"`
}
