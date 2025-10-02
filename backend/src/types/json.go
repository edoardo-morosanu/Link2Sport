package types

import (
	"database/sql/driver"
	"encoding/json"
)

// JSON type for handling jsonb payload
type JSON map[string]any

// Value implements driver.Valuer interface for GORM
func (j JSON) Value() (driver.Value, error) {
	if j == nil {
		return nil, nil
	}
	return json.Marshal(j)
}

// Scan implements sql.Scanner interface for GORM
func (j *JSON) Scan(value any) error {
	if value == nil {
		*j = nil
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}

	return json.Unmarshal(bytes, j)
}
