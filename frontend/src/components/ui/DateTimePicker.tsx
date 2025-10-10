"use client";

import { useState, useEffect } from "react";
import { TimePicker } from "./TimePicker";

interface DateTimePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  minDate?: Date;
  maxDate?: Date;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Select date and time",
  disabled = false,
  className = "",
  label,
  minDate,
  maxDate,
}: DateTimePickerProps) {
  const [dateValue, setDateValue] = useState("");
  const [timeValue, setTimeValue] = useState("");

  // Update internal state when value prop changes
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setDateValue(date.toISOString().split("T")[0]);
      setTimeValue(
        `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`,
      );
    } else {
      setDateValue("");
      setTimeValue("");
    }
  }, [value]);

  const handleDateChange = (newDate: string) => {
    setDateValue(newDate);
    updateDateTime(newDate, timeValue);
  };

  const handleTimeChange = (newTime: string) => {
    setTimeValue(newTime);
    updateDateTime(dateValue, newTime);
  };

  const updateDateTime = (date: string, time: string) => {
    if (date && time) {
      const [hours, minutes] = time.split(":").map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        const datetime = new Date(date);
        datetime.setHours(hours, minutes, 0, 0);

        // Check if the date is within allowed range
        if (minDate && datetime < minDate) {
          return;
        }
        if (maxDate && datetime > maxDate) {
          return;
        }

        onChange(datetime);
      }
    } else if (!date && !time) {
      onChange(null);
    }
  };

  const clearDateTime = () => {
    setDateValue("");
    setTimeValue("");
    onChange(null);
  };

  const setToNow = () => {
    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    setDateValue(date);
    setTimeValue(time);
    onChange(now);
  };

  const formatMinDate = minDate
    ? minDate.toISOString().split("T")[0]
    : undefined;
  const formatMaxDate = maxDate
    ? maxDate.toISOString().split("T")[0]
    : undefined;

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Date Input */}
        <div>
          <input
            type="date"
            value={dateValue}
            onChange={(e) => handleDateChange(e.target.value)}
            disabled={disabled}
            max={formatMaxDate}
            className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${className}`}
          />
        </div>

        {/* Time Input */}
        <TimePicker
          value={timeValue}
          onChange={handleTimeChange}
          placeholder="Select time"
          disabled={disabled}
          className={className}
        />
      </div>

      {/* Quick action buttons */}
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={setToNow}
          disabled={disabled}
          className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/70 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Now
        </button>

        {(dateValue || timeValue) && (
          <button
            type="button"
            onClick={clearDateTime}
            disabled={disabled}
            className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Validation messages */}
      {maxDate && value && value > maxDate && (
        <div className="text-sm text-red-600 dark:text-red-400">
          Date must be before {maxDate.toLocaleDateString()}
        </div>
      )}
    </div>
  );
}

export default DateTimePicker;
