package services

import (
	"backend/src/config"
	"backend/src/models"
	"log"
	"time"

	"gorm.io/gorm"
)

type EventStatusUpdater struct {
	db     *gorm.DB
	ticker *time.Ticker
	done   chan bool
}

// NewEventStatusUpdater creates a new event status updater service
func NewEventStatusUpdater() *EventStatusUpdater {
	return &EventStatusUpdater{
		db:   config.DB,
		done: make(chan bool),
	}
}

// Start begins the automatic event status update process
// It runs every minute to check for events that need status updates
func (esu *EventStatusUpdater) Start() {
	log.Println("Starting Event Status Updater service...")

	// Run immediately on start
	esu.updateEventStatuses()

	// Set up ticker to run every minute
	esu.ticker = time.NewTicker(1 * time.Minute)

	go func() {
		for {
			select {
			case <-esu.ticker.C:
				esu.updateEventStatuses()
			case <-esu.done:
				log.Println("Event Status Updater service stopped")
				return
			}
		}
	}()

	log.Println("Event Status Updater service started successfully")
}

// Stop gracefully stops the event status updater service
func (esu *EventStatusUpdater) Stop() {
	if esu.ticker != nil {
		esu.ticker.Stop()
	}
	esu.done <- true
}

// updateEventStatuses checks and updates event statuses based on current time
func (esu *EventStatusUpdater) updateEventStatuses() {
	now := time.Now()

	// Update upcoming events to active when start time is reached
	if err := esu.updateUpcomingToActive(now); err != nil {
		log.Printf("Error updating upcoming events to active: %v", err)
	}

	// Update active events to complete when end time is reached
	if err := esu.updateActiveToComplete(now); err != nil {
		log.Printf("Error updating active events to complete: %v", err)
	}
}

// updateUpcomingToActive transitions upcoming events to active when their start time has passed
func (esu *EventStatusUpdater) updateUpcomingToActive(now time.Time) error {
	result := esu.db.Model(&models.Event{}).
		Where("status = ? AND start_at <= ?", "upcoming", now).
		Update("status", "active")

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected > 0 {
		log.Printf("Updated %d events from 'upcoming' to 'active'", result.RowsAffected)
	}

	// Case 2: Active events with no end_at that started more than 1 hour ago
	cutoff := now.Add(-1 * time.Hour)
	result2 := esu.db.Model(&models.Event{}).
		Where("status = ? AND end_at IS NULL AND start_at <= ?", "active", cutoff).
		Update("status", "complete")

	if result2.Error != nil {
		return result2.Error
	}

	if result2.RowsAffected > 0 {
		log.Printf("Updated %d events without end time from 'active' to 'complete'", result2.RowsAffected)
	}

	return nil
}

// updateActiveToComplete transitions active events to complete when their end time has passed
func (esu *EventStatusUpdater) updateActiveToComplete(now time.Time) error {
	// Case 1: Active events with end_at in the past
	result := esu.db.Model(&models.Event{}).
		Where("status = ? AND end_at IS NOT NULL AND end_at <= ?", "active", now).
		Update("status", "complete")

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected > 0 {
		log.Printf("Updated %d events from 'active' to 'complete'", result.RowsAffected)
	}

	return nil
}

// GetEventsNeedingStatusUpdate returns events that need status updates (for testing/debugging)
func (esu *EventStatusUpdater) GetEventsNeedingStatusUpdate() ([]models.Event, error) {
	now := time.Now()
	var events []models.Event

	// Find upcoming events that should be active
	var upcomingEvents []models.Event
	if err := esu.db.Where("status = ? AND start_at <= ?", "upcoming", now).Find(&upcomingEvents).Error; err != nil {
		return nil, err
	}
	events = append(events, upcomingEvents...)

	// Find active events that should be complete
	var activeEvents []models.Event
	if err := esu.db.Where("status = ? AND end_at IS NOT NULL AND end_at <= ?", "active", now).Find(&activeEvents).Error; err != nil {
		return nil, err
	}
	events = append(events, activeEvents...)

	// Find active events with no end_at that started more than 1 hour ago
	cutoff := now.Add(-1 * time.Hour)
	var activeNoEnd []models.Event
	if err := esu.db.Where("status = ? AND end_at IS NULL AND start_at <= ?", "active", cutoff).Find(&activeNoEnd).Error; err != nil {
		return nil, err
	}
	events = append(events, activeNoEnd...)

	return events, nil
}

// ForceUpdateEventStatuses immediately runs the status update process (for manual triggers)
func (esu *EventStatusUpdater) ForceUpdateEventStatuses() error {
	log.Println("Force updating event statuses...")
	esu.updateEventStatuses()
	return nil
}
