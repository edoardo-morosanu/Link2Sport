"use client";

import { useState, useEffect, useRef } from "react";
import { Event, UpdateEventData, EventType, EventStatus } from "@/types/event";
import { MapTilerLocationPicker } from "@/components/ui/MapTilerLocationPicker";
import { DateTimePicker } from "@/components/ui";
import { SportService, Sport } from "@/services/sport";

interface EditEventModalProps {
  isOpen: boolean;
  event: Event;
  onClose: () => void;
  onSave: (eventData: UpdateEventData) => Promise<void>;
}

export function EditEventModal({
  isOpen,
  event,
  onClose,
  onSave,
}: EditEventModalProps) {
  const [formData, setFormData] = useState<UpdateEventData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);
  const [availableSports, setAvailableSports] = useState<Sport[]>([]);
  const [loadingSports, setLoadingSports] = useState(true);
  const [showSportsDropdown, setShowSportsDropdown] = useState(false);
  const [sportSearchInput, setSportSearchInput] = useState("");
  const [selectedSportIndex, setSelectedSportIndex] = useState(-1);
  const [locationData, setLocationData] = useState<
    | {
        name: string;
        latitude: number;
        longitude: number;
        address?: string;
      }
    | undefined
  >(undefined);

  // Mouse tracking for subtle hover effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (modalRef.current) {
        const rect = modalRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setMousePosition({ x, y });
      }
    };

    if (isOpen) {
      document.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isOpen]);

  // Load sports from API when modal opens
  useEffect(() => {
    const loadSports = async () => {
      if (!isOpen) return;

      try {
        setLoadingSports(true);
        const sportsData = await SportService.getAllSports();
        setAvailableSports(sportsData);
      } catch (error) {
        console.error("Failed to load sports:", error);
        // Fallback to a basic list if API fails
        setAvailableSports([
          { id: 1, name: "Football" },
          { id: 2, name: "Basketball" },
          { id: 3, name: "Tennis" },
          { id: 4, name: "Swimming" },
          { id: 5, name: "Running" },
        ]);
      } finally {
        setLoadingSports(false);
      }
    };

    loadSports();
  }, [isOpen]);

  // Initialize form data when event changes
  useEffect(() => {
    if (event) {
      setFormData({
        type: event.type,
        title: event.title,
        description: event.description,
        sport: event.sport,
        start_at: event.start_at,
        end_at: event.end_at,
        location_name: event.location_name,
        latitude: event.latitude,
        longitude: event.longitude,
        capacity: event.capacity,
      });

      // Clear sport search input since we have a selected sport
      setSportSearchInput("");

      // Set location data for the picker
      if (event.location_name && event.latitude && event.longitude) {
        setLocationData({
          name: event.location_name,
          latitude: event.latitude,
          longitude: event.longitude,
          address: event.location_name,
        });
      }
    }
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.title?.trim() ||
      !formData.sport?.trim() ||
      !formData.location_name?.trim()
    ) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update event");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      {/* Subtle animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-blue-400/5 to-purple-600/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-tr from-teal-400/5 to-blue-600/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-2xl w-full max-h-[95vh] overflow-y-auto">
        {/* Main glass container */}
        <div
          ref={modalRef}
          className="relative bg-white/85 dark:bg-gray-800/85 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6 transition-all duration-300 animate-in slide-in-from-bottom-8"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(59, 130, 246, 0.02), transparent 50%)`,
          }}
        >
          {/* Subtle inner gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/3 via-transparent to-blue-500/1 dark:from-gray-700/3 dark:to-purple-500/1 rounded-2xl pointer-events-none"></div>

          {/* Content */}
          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                  Edit Activity
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Update your activity details
                </p>
              </div>

              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100/50 dark:hover:bg-gray-700/30 rounded-lg"
              >
                <svg
                  className="w-6 h-6"
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
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 bg-red-50/90 dark:bg-red-900/30 backdrop-blur-sm border border-red-200/50 dark:border-red-800/50 rounded-xl p-3 animate-in slide-in-from-top-2 duration-300">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                  {error}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Activity Type Selector */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">
                  Activity Type *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      value: "game",
                      label: "Game",
                      desc: "Competitive match",
                    },
                    {
                      value: "training",
                      label: "Training",
                      desc: "Practice session",
                    },
                    {
                      value: "event",
                      label: "Event",
                      desc: "Social gathering",
                    },
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          type: type.value as EventType,
                        })
                      }
                      disabled={isSubmitting}
                      className={`p-4 rounded-xl border-2 text-center transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${
                        formData.type === type.value
                          ? "border-blue-500/70 bg-blue-50/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 shadow-md"
                          : "border-gray-200/50 dark:border-gray-600/30 bg-gray-50/50 dark:bg-gray-700/20 hover:border-gray-300/60 dark:hover:border-gray-500/40 hover:bg-gray-50/80 dark:hover:bg-gray-700/30"
                      } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                    >
                      <div className="font-medium text-sm">{type.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {type.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title and Sport Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-50/70 dark:bg-gray-700/30 backdrop-blur-sm border-2 border-gray-200/50 dark:border-gray-600/30 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-300/60 dark:hover:border-gray-500/40 hover:bg-gray-50/90 dark:hover:bg-gray-700/40 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="e.g., Friday Basketball Game"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2 relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">
                    Sport *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={sportSearchInput}
                      onChange={(e) => {
                        setSportSearchInput(e.target.value);
                        setSelectedSportIndex(-1);
                      }}
                      onKeyDown={(e) => {
                        const filteredSports = availableSports
                          .filter((sport) =>
                            sport.name
                              .toLowerCase()
                              .includes(sportSearchInput.toLowerCase()),
                          )
                          .slice(0, 10);

                        if (e.key === "ArrowDown") {
                          e.preventDefault();
                          setSelectedSportIndex((prev) =>
                            prev < filteredSports.length - 1 ? prev + 1 : prev,
                          );
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          setSelectedSportIndex((prev) =>
                            prev > 0 ? prev - 1 : -1,
                          );
                        } else if (
                          e.key === "Enter" &&
                          selectedSportIndex >= 0
                        ) {
                          e.preventDefault();
                          const selectedSport =
                            filteredSports[selectedSportIndex];
                          if (selectedSport) {
                            setFormData({
                              ...formData,
                              sport: selectedSport.name,
                            });
                            setSportSearchInput("");
                            setShowSportsDropdown(false);
                            setSelectedSportIndex(-1);
                          }
                        } else if (e.key === "Escape") {
                          setShowSportsDropdown(false);
                          setSelectedSportIndex(-1);
                        }
                      }}
                      onFocus={() => {
                        setShowSportsDropdown(true);
                        setSelectedSportIndex(-1);
                      }}
                      onBlur={() => {
                        // Delay hiding to allow clicking on dropdown items
                        setTimeout(() => {
                          setShowSportsDropdown(false);
                          setSelectedSportIndex(-1);
                        }, 150);
                      }}
                      className="w-full px-4 py-3 bg-gray-50/70 dark:bg-gray-700/30 backdrop-blur-sm border-2 border-gray-200/50 dark:border-gray-600/30 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-300/60 dark:hover:border-gray-500/40 hover:bg-gray-50/90 dark:hover:bg-gray-700/40 placeholder-gray-500 dark:placeholder-gray-400"
                      placeholder={
                        loadingSports
                          ? "Loading sports..."
                          : formData.sport || "Search for a sport..."
                      }
                      disabled={isSubmitting || loadingSports}
                    />

                    {/* Selected Sport Display */}
                    {formData.sport && !showSportsDropdown && (
                      <div className="absolute inset-0 px-4 py-3 flex items-center justify-between pointer-events-none">
                        <span className="text-gray-900 dark:text-white">
                          {formData.sport}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, sport: "" });
                            setSportSearchInput("");
                          }}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 pointer-events-auto"
                        >
                          ×
                        </button>
                      </div>
                    )}

                    {/* Sports Dropdown */}
                    {showSportsDropdown &&
                      !loadingSports &&
                      availableSports.length > 0 && (
                        <div className="absolute z-30 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                          {availableSports
                            .filter((sport) =>
                              sport.name
                                .toLowerCase()
                                .includes(sportSearchInput.toLowerCase()),
                            )
                            .slice(0, 10)
                            .map((sport, index) => (
                              <button
                                key={sport.id}
                                type="button"
                                onMouseDown={() => {
                                  setFormData({
                                    ...formData,
                                    sport: sport.name,
                                  });
                                  setSportSearchInput("");
                                  setShowSportsDropdown(false);
                                  setSelectedSportIndex(-1);
                                }}
                                onMouseEnter={() =>
                                  setSelectedSportIndex(index)
                                }
                                className={`w-full px-4 py-3 text-left transition-colors duration-200 first:rounded-t-xl last:rounded-b-xl ${
                                  selectedSportIndex === index
                                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                    : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                                }`}
                              >
                                {sport.name}
                              </button>
                            ))}
                        </div>
                      )}

                    {/* Loading Sports Dropdown */}
                    {showSportsDropdown && loadingSports && (
                      <div className="absolute z-30 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg p-4">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                            Loading sports...
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">
                  Description
                </label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-50/70 dark:bg-gray-700/30 backdrop-blur-sm border-2 border-gray-200/50 dark:border-gray-600/30 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed resize-none hover:border-gray-300/60 dark:hover:border-gray-500/40 hover:bg-gray-50/90 dark:hover:bg-gray-700/40 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Tell people about your activity..."
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>

              {/* Date/Time Row */}
              <div className="space-y-4">
                <DateTimePicker
                  value={formData.start_at}
                  onChange={(date) =>
                    setFormData({ ...formData, start_at: date || new Date() })
                  }
                  label="Start Date & Time *"
                  disabled={isSubmitting}
                />

                <DateTimePicker
                  value={formData.end_at || null}
                  onChange={(date) =>
                    setFormData({ ...formData, end_at: date })
                  }
                  label="End Date & Time (Optional)"
                  disabled={isSubmitting}
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">
                  Location *
                </label>
                <MapTilerLocationPicker
                  value={locationData}
                  onChange={(location) => {
                    setLocationData(location);
                    setFormData({
                      ...formData,
                      location_name: location.name,
                      latitude: location.latitude,
                      longitude: location.longitude,
                    });
                  }}
                  placeholder="Search for a location or click on the map..."
                  disabled={isSubmitting}
                  apiKey={process.env.NEXT_PUBLIC_MAPTILER_API_KEY}
                  showMap={true}
                  mapHeight="250px"
                  language="en"
                />
              </div>

              {/* Capacity */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">
                  Max Participants (Optional)
                </label>
                <input
                  type="number"
                  value={formData.capacity || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      capacity: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                  className="w-full px-4 py-3 bg-gray-50/70 dark:bg-gray-700/30 backdrop-blur-sm border-2 border-gray-200/50 dark:border-gray-600/30 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-300/60 dark:hover:border-gray-500/40 hover:bg-gray-50/90 dark:hover:bg-gray-700/40 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Leave empty for unlimited"
                  min="2"
                  disabled={isSubmitting}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-gray-50/70 dark:bg-gray-700/30 backdrop-blur-sm border-2 border-gray-200/50 dark:border-gray-600/30 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-700/50 hover:border-gray-300/60 dark:hover:border-gray-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium transform hover:scale-[1.01] active:scale-[0.99]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600/90 to-blue-700/90 hover:from-blue-700 hover:to-blue-800 backdrop-blur-sm text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium transform hover:scale-[1.01] active:scale-[0.99] shadow-md hover:shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Updating...
                    </>
                  ) : (
                    "Update Activity"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
