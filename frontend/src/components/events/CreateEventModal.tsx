"use client";

import { useState, useEffect } from "react";
import { CreateEventData, EventType } from "@/types/event";
import { MapTilerLocationPicker } from "@/components/ui/MapTilerLocationPicker";
import { DateTimePicker } from "@/components/ui";
import { SportService, Sport } from "@/services/sport";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/primitives/Button";
import { Input } from "@/components/ui/primitives/Input";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: CreateEventData) => Promise<void>;
}

export function CreateEventModal({
  isOpen,
  onClose,
  onSave,
}: CreateEventModalProps) {
  const [formData, setFormData] = useState<CreateEventData>({
    type: "game" as EventType,
    title: "",
    description: "",
    sport: "",
    start_at: new Date(),
    end_at: undefined,
    location_name: "",
    latitude: 0,
    longitude: 0,
    capacity: undefined,
  });
  const [locationData, setLocationData] = useState<
    | {
        name: string;
        latitude: number;
        longitude: number;
        address?: string;
      }
    | undefined
  >(undefined);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableSports, setAvailableSports] = useState<Sport[]>([]);
  const [loadingSports, setLoadingSports] = useState(true);
  const [showSportsDropdown, setShowSportsDropdown] = useState(false);
  const [sportSearchInput, setSportSearchInput] = useState("");
  const [selectedSportIndex, setSelectedSportIndex] = useState(-1);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.title.trim() ||
      !formData.sport.trim() ||
      !formData.location_name.trim()
    ) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave(formData);
      onClose();
      // Reset form
      setFormData({
        type: "game" as EventType,
        title: "",
        description: "",
        sport: "",
        start_at: new Date(),
        end_at: undefined,
        location_name: "",
        latitude: 0,
        longitude: 0,
        capacity: undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        type: "game" as EventType,
        title: "",
        description: "",
        sport: "",
        start_at: new Date(),
        end_at: undefined,
        location_name: "",
        latitude: 0,
        longitude: 0,
        capacity: undefined,
      });
      setLocationData(undefined);
      setError(null);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Create Activity</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">Share a sports activity with the community</p>
        </div>
      }
      variant="blue"
      size="xl"
      icon={
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      }
    >
      <div className="p-6 max-h-[80vh] overflow-y-auto">
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
                <label className="block text-sm font-medium text-[var(--text-secondary)] transition-colors duration-300">
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
                  <label className="block text-sm font-medium text-[var(--text-secondary)] transition-colors duration-300">
                    Title *
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Friday Basketball Game"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2 relative">
                  <label className="block text-sm font-medium text-[var(--text-secondary)] transition-colors duration-300">
                    Sport *
                  </label>
                  <div className="relative">
                    <Input
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
                        <span className="text-[var(--text-primary)]">
                          {formData.sport}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, sport: "" });
                            setSportSearchInput("");
                          }}
                          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] pointer-events-auto"
                        >
                          ×
                        </button>
                      </div>
                    )}

                    {/* Sports Dropdown */}
                    {showSportsDropdown &&
                      !loadingSports &&
                      availableSports.length > 0 && (
                        <div className="absolute z-30 w-full mt-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-lg max-h-40 overflow-y-auto">
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
                                    : "hover:bg-[var(--card-hover-bg)] text-[var(--text-primary)]"
                                }`}
                              >
                                {sport.name}
                              </button>
                            ))}
                        </div>
                      )}

                    {/* Loading Sports Dropdown */}
                    {showSportsDropdown && loadingSports && (
                      <div className="absolute z-30 w-full mt-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-lg p-4">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                          <span className="ml-2 text-sm text-[var(--text-secondary)]">
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
                <label className="block text-sm font-medium text-[var(--text-secondary)] transition-colors duration-300">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-[var(--border-color)] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--card-hover-bg)] text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                  placeholder="Tell people about your activity..."
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>

              {/* Date & Time Section */}
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
                    setFormData({ ...formData, end_at: date || undefined })
                  }
                  label="End Date & Time (Optional)"
                  disabled={isSubmitting}
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)] transition-colors duration-300">
                  Location *
                </label>
                <MapTilerLocationPicker
                  value={locationData}
                  onChange={(location) => {
                    setLocationData(location);
                    setFormData((prev) => ({
                      ...prev,
                      location_name: location.name,
                      latitude: location.latitude,
                      longitude: location.longitude,
                    }));
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
                <label className="block text-sm font-medium text-[var(--text-secondary)] transition-colors duration-300">
                  Max Participants (Optional)
                </label>
                <Input
                  type="number"
                  value={formData.capacity ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      capacity: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="Leave empty for unlimited"
                  min={2}
                  disabled={isSubmitting}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex space-x-4 pt-4">
                <Button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  variant="secondary"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  variant="primary"
                  className="flex-1"
                >
                  {isSubmitting ? "Creating..." : "Create Activity"}
                </Button>
              </div>
        </form>
      </div>
    </Modal>
  );
}
