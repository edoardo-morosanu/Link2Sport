package seeds

import (
	"backend/src/config"
	"backend/src/models"
	"log"
)

// SeedSports creates the initial sports data in the database
func SeedSports() error {
	sports := []models.Sport{
		{Name: "Football"},
		{Name: "Basketball"},
		{Name: "Tennis"},
		{Name: "Swimming"},
		{Name: "Running"},
		{Name: "Cycling"},
		{Name: "Volleyball"},
		{Name: "Baseball"},
		{Name: "Soccer"},
		{Name: "Golf"},
		{Name: "Boxing"},
		{Name: "Wrestling"},
		{Name: "Badminton"},
		{Name: "Table Tennis"},
		{Name: "Hockey"},
		{Name: "Rugby"},
		{Name: "Cricket"},
		{Name: "Skiing"},
		{Name: "Snowboarding"},
		{Name: "Surfing"},
		{Name: "Rock Climbing"},
		{Name: "Martial Arts"},
		{Name: "Yoga"},
		{Name: "Pilates"},
		{Name: "CrossFit"},
		{Name: "Weightlifting"},
		{Name: "Track and Field"},
		{Name: "Gymnastics"},
		{Name: "Ice Skating"},
		{Name: "Roller Skating"},
		{Name: "Skateboarding"},
		{Name: "Archery"},
		{Name: "Bowling"},
		{Name: "Darts"},
		{Name: "Pool/Billiards"},
		{Name: "Fishing"},
		{Name: "Hiking"},
		{Name: "Mountain Biking"},
		{Name: "Kayaking"},
		{Name: "Canoeing"},
		{Name: "Rowing"},
		{Name: "Sailing"},
		{Name: "Water Skiing"},
		{Name: "Wakeboarding"},
		{Name: "Scuba Diving"},
		{Name: "Snorkeling"},
		{Name: "Triathlon"},
		{Name: "Marathon"},
		{Name: "Parkour"},
		{Name: "Ultimate Frisbee"},
	}

	for _, sport := range sports {
		// Check if sport already exists
		var existingSport models.Sport
		result := config.DB.Where("name = ?", sport.Name).First(&existingSport)

		if result.Error != nil {
			// Sport doesn't exist, create it
			if err := config.DB.Create(&sport).Error; err != nil {
				log.Printf("Failed to create sport %s: %v", sport.Name, err)
				return err
			}
			log.Printf("Created sport: %s", sport.Name)
		} else {
			log.Printf("Sport already exists: %s", sport.Name)
		}
	}

	log.Println("Sports seeding completed successfully")
	return nil
}
