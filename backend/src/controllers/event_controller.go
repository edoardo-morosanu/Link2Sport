package controllers

import (
	"backend/src/config"
	"backend/src/models"
	"backend/src/services"
	"backend/src/types"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type EventController struct{}

func NewEventController() *EventController {
	return &EventController{}
}

// CreateEvent godoc
// @Summary      Create a new event
// @Description  Create a new sports event/activity
// @Tags         Events
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        event body types.CreateEventRequest true "Event data"
// @Success      201 {object} types.EventResponse "Event created successfully"
// @Failure      400 {object} types.ErrorResponse "Invalid request data"
// @Failure      401 {object} types.ErrorResponse "User not authenticated"
// @Router       /events [post]
func (ec *EventController) CreateEvent(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "User not authenticated",
		})
		return
	}

	var req types.CreateEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	// Calculate initial status based on event timing
	initialStatus := types.CalculateEventStatus(req.StartAt, req.EndAt)

	event := models.Event{
		OrganizerID:  userID.(uint),
		Type:         string(req.Type),
		Title:        req.Title,
		Description:  req.Description,
		Sport:        req.Sport,
		StartAt:      req.StartAt,
		EndAt:        req.EndAt,
		LocationName: req.LocationName,
		Latitude:     &req.Latitude,
		Longitude:    &req.Longitude,
		Capacity:     req.Capacity,
		Status:       string(initialStatus),
	}

	if err := config.DB.Create(&event).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Database error",
			Message: "Failed to create event",
		})
		return
	}

	var participantCount int64
	config.DB.Model(&models.EventParticipant{}).Where("event_id = ?", event.ID).Count(&participantCount)

	response := types.EventResponse{
		ID:           event.ID,
		OrganizerID:  event.OrganizerID,
		Type:         types.EventType(event.Type),
		Title:        event.Title,
		Description:  event.Description,
		Sport:        event.Sport,
		StartAt:      event.StartAt,
		EndAt:        event.EndAt,
		LocationName: event.LocationName,
		Latitude:     *event.Latitude,
		Longitude:    *event.Longitude,
		Capacity:     event.Capacity,
		Participants: int(participantCount),
		Status:       types.EventStatus(event.Status),
		CreatedAt:    event.CreatedAt,
		UpdatedAt:    event.UpdatedAt,
	}

	c.JSON(http.StatusCreated, response)
}

// GetEvents godoc
// @Summary      Get all events
// @Description  Retrieve all events with optional filtering
// @Tags         Events
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        sport query string false "Filter by sport"
// @Param        type query string false "Filter by type (game, event, training)"
// @Param        limit query int false "Limit number of results" default(20)
// @Param        offset query int false "Offset for pagination" default(0)
// @Success      200 {array} types.EventWithOrganizerResponse "List of events"
// @Failure      401 {object} types.ErrorResponse "User not authenticated"
// @Router       /events [get]
func (ec *EventController) GetEvents(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "User not authenticated",
		})
		return
	}

	sport := c.Query("sport")
	eventType := c.Query("type")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	query := config.DB.Preload("Organizer").Where("deleted_at IS NULL")
	if sport != "" {
		query = query.Where("sport = ?", sport)
	}
	if eventType != "" {
		query = query.Where("type = ?", eventType)
	}

	var events []models.Event
	if err := query.Limit(limit).Offset(offset).Order("start_at ASC").Find(&events).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Database error",
			Message: "Failed to fetch events",
		})
		return
	}

	response := make([]types.EventWithOrganizerResponse, 0)
	for _, event := range events {
		var participantCount int64
		config.DB.Model(&models.EventParticipant{}).Where("event_id = ?", event.ID).Count(&participantCount)

		isOrganizer := event.OrganizerID == userID.(uint)

		var participantExists int64
		config.DB.Model(&models.EventParticipant{}).Where("event_id = ? AND user_id = ?", event.ID, userID).Count(&participantExists)
		isParticipant := participantExists > 0
		avatarURL := fmt.Sprintf("/api/user/%d/avatar", event.Organizer.ID)

		eventResponse := types.EventWithOrganizerResponse{
			EventResponse: types.EventResponse{
				ID:           event.ID,
				OrganizerID:  event.OrganizerID,
				Type:         types.EventType(event.Type),
				Title:        event.Title,
				Description:  event.Description,
				Sport:        event.Sport,
				StartAt:      event.StartAt,
				EndAt:        event.EndAt,
				LocationName: event.LocationName,
				Latitude:     *event.Latitude,
				Longitude:    *event.Longitude,
				Capacity:     event.Capacity,
				Participants: int(participantCount),
				Status:       types.EventStatus(event.Status),
				CreatedAt:    event.CreatedAt,
				UpdatedAt:    event.UpdatedAt,
			},
			OrganizerName:     event.Organizer.DisplayName,
			OrganizerUsername: event.Organizer.Username,
			OrganizerAvatar:   &avatarURL,
			IsOrganizer:       isOrganizer,
			IsParticipant:     isParticipant,
		}

		response = append(response, eventResponse)
	}

	c.JSON(http.StatusOK, response)
}

// GetUserEvents godoc
// @Summary      Get user's events
// @Description  Retrieve events created by the authenticated user
// @Tags         Events
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {array} types.EventResponse "List of user's events"
// @Failure      401 {object} types.ErrorResponse "User not authenticated"
// @Router       /events/my [get]
func (ec *EventController) GetUserEvents(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "User not authenticated",
		})
		return
	}

	var events []models.Event
	if err := config.DB.Where("organizer_id = ? AND deleted_at IS NULL", userID).Order("start_at ASC").Find(&events).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Database error",
			Message: "Failed to fetch user events",
		})
		return
	}

	response := make([]types.EventResponse, 0)
	for _, event := range events {
		var participantCount int64
		config.DB.Model(&models.EventParticipant{}).Where("event_id = ?", event.ID).Count(&participantCount)

		eventResponse := types.EventResponse{
			ID:           event.ID,
			OrganizerID:  event.OrganizerID,
			Type:         types.EventType(event.Type),
			Title:        event.Title,
			Description:  event.Description,
			Sport:        event.Sport,
			StartAt:      event.StartAt,
			EndAt:        event.EndAt,
			LocationName: event.LocationName,
			Latitude:     *event.Latitude,
			Longitude:    *event.Longitude,
			Capacity:     event.Capacity,
			Participants: int(participantCount),
			Status:       types.EventStatus(event.Status),
			CreatedAt:    event.CreatedAt,
			UpdatedAt:    event.UpdatedAt,
		}

		response = append(response, eventResponse)
	}

	c.JSON(http.StatusOK, response)
}

// GetEvent godoc
// @Summary      Get event by ID
// @Description  Retrieve a specific event by its ID
// @Tags         Events
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Event ID"
// @Success      200 {object} types.EventWithOrganizerResponse "Event details"
// @Failure      404 {object} types.ErrorResponse "Event not found"
// @Failure      401 {object} types.ErrorResponse "User not authenticated"
// @Router       /events/{id} [get]
func (ec *EventController) GetEvent(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "User not authenticated",
		})
		return
	}

	eventID := c.Param("id")
	eventIDInt, err := strconv.ParseUint(eventID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid event ID",
			Message: "Event ID must be a valid number",
		})
		return
	}

	var event models.Event
	if err := config.DB.Preload("Organizer").First(&event, eventIDInt).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Error:   "Event not found",
			Message: "The requested event does not exist",
		})
		return
	}

	// Get participant count
	var participantCount int64
	config.DB.Model(&models.EventParticipant{}).Where("event_id = ?", event.ID).Count(&participantCount)

	// Check if user is organizer
	isOrganizer := event.OrganizerID == userID.(uint)

	// Check if user is participant
	var participantExists int64
	config.DB.Model(&models.EventParticipant{}).Where("event_id = ? AND user_id = ?", event.ID, userID).Count(&participantExists)
	isParticipant := participantExists > 0

	avatarURL := fmt.Sprintf("/api/user/%d/avatar", event.Organizer.ID)

	response := types.EventWithOrganizerResponse{
		EventResponse: types.EventResponse{
			ID:           event.ID,
			OrganizerID:  event.OrganizerID,
			Type:         types.EventType(event.Type),
			Title:        event.Title,
			Description:  event.Description,
			Sport:        event.Sport,
			StartAt:      event.StartAt,
			EndAt:        event.EndAt,
			LocationName: event.LocationName,
			Latitude:     *event.Latitude,
			Longitude:    *event.Longitude,
			Capacity:     event.Capacity,
			Participants: int(participantCount),
			Status:       types.EventStatus(event.Status),
			CreatedAt:    event.CreatedAt,
			UpdatedAt:    event.UpdatedAt,
		},
		OrganizerName:     event.Organizer.DisplayName,
		OrganizerUsername: event.Organizer.Username,
		OrganizerAvatar:   &avatarURL,
		IsOrganizer:       isOrganizer,
		IsParticipant:     isParticipant,
	}

	c.JSON(http.StatusOK, response)
}

// UpdateEvent godoc
// @Summary      Update event
// @Description  Update an existing event (only by organizer)
// @Tags         Events
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Event ID"
// @Param        event body types.UpdateEventRequest true "Updated event data"
// @Success      200 {object} types.EventResponse "Event updated successfully"
// @Failure      400 {object} types.ErrorResponse "Invalid request data"
// @Failure      401 {object} types.ErrorResponse "User not authenticated"
// @Failure      403 {object} types.ErrorResponse "Not authorized to update this event"
// @Failure      404 {object} types.ErrorResponse "Event not found"
// @Router       /events/{id} [put]
func (ec *EventController) UpdateEvent(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "User not authenticated",
		})
		return
	}

	eventID := c.Param("id")
	eventIDInt, err := strconv.ParseUint(eventID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid event ID",
			Message: "Event ID must be a valid number",
		})
		return
	}

	var event models.Event
	if err := config.DB.First(&event, eventIDInt).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Error:   "Event not found",
			Message: "The requested event does not exist",
		})
		return
	}

	// Check if user is the organizer
	if event.OrganizerID != userID.(uint) {
		c.JSON(http.StatusForbidden, types.ErrorResponse{
			Error:   "Forbidden",
			Message: "You can only update your own events",
		})
		return
	}

	var req types.UpdateEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	// Update fields if provided
	if req.Type != nil {
		event.Type = string(*req.Type)
	}
	if req.Title != nil {
		event.Title = *req.Title
	}
	if req.Description != nil {
		event.Description = *req.Description
	}
	if req.Sport != nil {
		event.Sport = *req.Sport
	}
	if req.StartAt != nil {
		event.StartAt = *req.StartAt
	}
	if req.EndAt != nil {
		event.EndAt = req.EndAt
	}
	if req.LocationName != nil {
		event.LocationName = *req.LocationName
	}
	if req.Latitude != nil {
		event.Latitude = req.Latitude
	}
	if req.Longitude != nil {
		event.Longitude = req.Longitude
	}
	if req.Capacity != nil {
		event.Capacity = req.Capacity
	}

	// Recalculate status based on updated times (don't allow manual status changes)
	updatedStatus := types.CalculateEventStatus(event.StartAt, event.EndAt)
	event.Status = string(updatedStatus)

	if err := config.DB.Save(&event).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Database error",
			Message: "Failed to update event",
		})
		return
	}

	// Get participant count
	var participantCount int64
	config.DB.Model(&models.EventParticipant{}).Where("event_id = ?", event.ID).Count(&participantCount)

	response := types.EventResponse{
		ID:           event.ID,
		OrganizerID:  event.OrganizerID,
		Type:         types.EventType(event.Type),
		Title:        event.Title,
		Description:  event.Description,
		Sport:        event.Sport,
		StartAt:      event.StartAt,
		EndAt:        event.EndAt,
		LocationName: event.LocationName,
		Latitude:     *event.Latitude,
		Longitude:    *event.Longitude,
		Capacity:     event.Capacity,
		Participants: int(participantCount),
		Status:       types.EventStatus(event.Status),
		CreatedAt:    event.CreatedAt,
		UpdatedAt:    event.UpdatedAt,
	}

	c.JSON(http.StatusOK, response)
}

// DeleteEvent godoc
// @Summary      Delete event
// @Description  Delete an existing event (only by organizer)
// @Tags         Events
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Event ID"
// @Success      204 "Event deleted successfully"
// @Failure      401 {object} types.ErrorResponse "User not authenticated"
// @Failure      403 {object} types.ErrorResponse "Not authorized to delete this event"
// @Failure      404 {object} types.ErrorResponse "Event not found"
// @Router       /events/{id} [delete]
func (ec *EventController) DeleteEvent(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "User not authenticated",
		})
		return
	}

	eventID := c.Param("id")
	eventIDInt, err := strconv.ParseUint(eventID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid event ID",
			Message: "Event ID must be a valid number",
		})
		return
	}

	var event models.Event
	if err := config.DB.First(&event, eventIDInt).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Error:   "Event not found",
			Message: "The requested event does not exist",
		})
		return
	}

	// Check if user is the organizer
	if event.OrganizerID != userID.(uint) {
		c.JSON(http.StatusForbidden, types.ErrorResponse{
			Error:   "Forbidden",
			Message: "You can only delete your own events",
		})
		return
	}

	// Set status to cancelled and soft delete the event
	event.Status = "cancelled"
	if err := config.DB.Save(&event).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Database error",
			Message: "Failed to cancel event",
		})
		return
	}

	if err := config.DB.Delete(&event).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Database error",
			Message: "Failed to delete event",
		})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// JoinEvent godoc
// @Summary      Join an event
// @Description  Join an event as a participant
// @Tags         Events
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Event ID"
// @Success      201 {object} gin.H "Successfully joined event"
// @Failure      400 {object} types.ErrorResponse "Invalid request or already joined"
// @Failure      401 {object} types.ErrorResponse "User not authenticated"
// @Failure      404 {object} types.ErrorResponse "Event not found"
// @Failure      409 {object} types.ErrorResponse "Event is full or cannot join"
// @Router       /events/{id}/join [post]
func (ec *EventController) JoinEvent(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "User not authenticated",
		})
		return
	}

	eventID := c.Param("id")
	eventIDInt, err := strconv.ParseUint(eventID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid event ID",
			Message: "Event ID must be a valid number",
		})
		return
	}

	var event models.Event
	if err := config.DB.First(&event, eventIDInt).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Error:   "Event not found",
			Message: "The requested event does not exist",
		})
		return
	}

	// Check if user is the organizer
	if event.OrganizerID == userID.(uint) {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Message: "You cannot join your own event",
		})
		return
	}

	// Check if event status allows joining
	if event.Status != "upcoming" {
		c.JSON(http.StatusConflict, types.ErrorResponse{
			Error:   "Event unavailable",
			Message: "Cannot join this event",
		})
		return
	}

	// Check if already joined
	var existingParticipant models.EventParticipant
	if err := config.DB.Where("event_id = ? AND user_id = ?", eventIDInt, userID).First(&existingParticipant).Error; err == nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Already joined",
			Message: "You are already participating in this event",
		})
		return
	}

	// Check capacity if it exists
	if event.Capacity != nil {
		var currentParticipants int64
		config.DB.Model(&models.EventParticipant{}).Where("event_id = ?", eventIDInt).Count(&currentParticipants)
		if currentParticipants >= int64(*event.Capacity) {
			c.JSON(http.StatusConflict, types.ErrorResponse{
				Error:   "Event full",
				Message: "This event has reached its maximum capacity",
			})
			return
		}
	}

	// Create participation record
	participant := models.EventParticipant{
		EventID:  uint(eventIDInt),
		UserID:   userID.(uint),
		Role:     "participant",
		JoinedAt: time.Now(),
	}

	if err := config.DB.Create(&participant).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Database error",
			Message: "Failed to join event",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "Successfully joined event",
		"event_id": eventIDInt,
	})
}

// LeaveEvent godoc
// @Summary      Leave an event
// @Description  Leave an event as a participant
// @Tags         Events
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Event ID"
// @Success      200 {object} gin.H "Successfully left event"
// @Failure      400 {object} types.ErrorResponse "Invalid request or not participating"
// @Failure      401 {object} types.ErrorResponse "User not authenticated"
// @Failure      404 {object} types.ErrorResponse "Event not found"
// @Router       /events/{id}/leave [delete]
func (ec *EventController) LeaveEvent(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "User not authenticated",
		})
		return
	}

	eventID := c.Param("id")
	eventIDInt, err := strconv.ParseUint(eventID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid event ID",
			Message: "Event ID must be a valid number",
		})
		return
	}

	var event models.Event
	if err := config.DB.First(&event, eventIDInt).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Error:   "Event not found",
			Message: "The requested event does not exist",
		})
		return
	}

	// Find participation record
	var participant models.EventParticipant
	if err := config.DB.Where("event_id = ? AND user_id = ?", eventIDInt, userID).First(&participant).Error; err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Not participating",
			Message: "You are not participating in this event",
		})
		return
	}

	// Delete participation record
	if err := config.DB.Delete(&participant).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Database error",
			Message: "Failed to leave event",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Successfully left event",
		"event_id": eventIDInt,
	})
}

// GetEventParticipants godoc
// @Summary      Get event participants
// @Description  Get list of participants for an event
// @Tags         Events
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Event ID"
// @Success      200 {array} models.EventParticipant "List of participants"
// @Failure      401 {object} types.ErrorResponse "User not authenticated"
// @Failure      404 {object} types.ErrorResponse "Event not found"
// @Router       /events/{id}/participants [get]
func (ec *EventController) GetEventParticipants(c *gin.Context) {
	_, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "User not authenticated",
		})
		return
	}

	eventID := c.Param("id")
	eventIDInt, err := strconv.ParseUint(eventID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid event ID",
			Message: "Event ID must be a valid number",
		})
		return
	}

	// Check if event exists
	var event models.Event
	if err := config.DB.First(&event, eventIDInt).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Error:   "Event not found",
			Message: "The requested event does not exist",
		})
		return
	}

	var participants []models.EventParticipant
	if err := config.DB.Preload("User").Where("event_id = ?", eventIDInt).Find(&participants).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Database error",
			Message: "Failed to fetch participants",
		})
		return
	}

	c.JSON(http.StatusOK, participants)
}

// UpdateEventStatuses manually triggers event status updates
// @Summary Update event statuses
// @Description Manually trigger automatic event status updates (upcoming -> active -> complete)
// @Tags Events
// @Security BearerAuth
// @Success 200 {object} types.SuccessResponse
// @Failure 401 {object} types.ErrorResponse "Unauthorized"
// @Failure 500 {object} types.ErrorResponse "Internal server error"
// @Router /api/events/update-statuses [post]
func (ec *EventController) UpdateEventStatuses(c *gin.Context) {
	_, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "User not authenticated",
		})
		return
	}

	// Create status updater and force update
	statusUpdater := services.NewEventStatusUpdater()
	if err := statusUpdater.ForceUpdateEventStatuses(); err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Update failed",
			Message: "Failed to update event statuses",
		})
		return
	}

	c.JSON(http.StatusOK, types.SuccessResponse{
		Message: "Event statuses updated successfully",
	})
}

// GetEventsNeedingUpdate returns events that need status updates
// @Summary Get events needing status updates
// @Description Get list of events that need status updates based on current time
// @Tags Events
// @Security BearerAuth
// @Success 200 {array} types.EventResponse
// @Failure 401 {object} types.ErrorResponse "Unauthorized"
// @Failure 500 {object} types.ErrorResponse "Internal server error"
// @Router /api/events/needing-update [get]
func (ec *EventController) GetEventsNeedingUpdate(c *gin.Context) {
	_, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "User not authenticated",
		})
		return
	}

	// Create status updater and get events needing update
	statusUpdater := services.NewEventStatusUpdater()
	events, err := statusUpdater.GetEventsNeedingStatusUpdate()
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Database error",
			Message: "Failed to fetch events needing update",
		})
		return
	}

	// Convert to response format
	var eventResponses []types.EventResponse
	for _, event := range events {
		// Get participant count
		var participantCount int64
		config.DB.Model(&models.EventParticipant{}).Where("event_id = ?", event.ID).Count(&participantCount)

		eventResponse := types.EventResponse{
			ID:           event.ID,
			OrganizerID:  event.OrganizerID,
			Type:         types.EventType(event.Type),
			Title:        event.Title,
			Description:  event.Description,
			Sport:        event.Sport,
			StartAt:      event.StartAt,
			EndAt:        event.EndAt,
			LocationName: event.LocationName,
			Latitude:     *event.Latitude,
			Longitude:    *event.Longitude,
			Capacity:     event.Capacity,
			Participants: int(participantCount),
			Status:       types.EventStatus(event.Status),
			CreatedAt:    event.CreatedAt,
			UpdatedAt:    event.UpdatedAt,
		}
		eventResponses = append(eventResponses, eventResponse)
	}

	c.JSON(http.StatusOK, eventResponses)
}
