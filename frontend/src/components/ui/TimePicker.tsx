"use client";

import { useState, useRef, useEffect } from "react";

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export function TimePicker({
  value,
  onChange,
  placeholder = "Select time",
  disabled = false,
  className = "",
  label,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTimeSelect = (timeString: string) => {
    onChange(timeString);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);
  };

  const displayValue = value || "";

  const presetTimes = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
    "22:00",
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="time"
          value={displayValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-4 py-3 border border-[var(--border-color)] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--card-hover-bg)] text-[var(--text-primary)] ${className}`}
        />

        <div className="absolute inset-y-0 right-10 flex items-center">
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className="px-2 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
          >
            Presets
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-64 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-lg">
          <div className="p-4">
            <div className="text-xs font-medium text-[var(--text-muted)] mb-2">
              Quick Select
            </div>
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {presetTimes.map((time) => (
                <button
                  key={time}
                  onClick={() => handleTimeSelect(time)}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    value === time
                      ? "bg-blue-600 text-white"
                      : "bg-[var(--card-hover-bg)] text-[var(--text-secondary)] hover:bg-blue-100"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>

            <div className="flex justify-end mt-4 pt-4 border-t border-[var(--border-color)]">
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TimePicker;
