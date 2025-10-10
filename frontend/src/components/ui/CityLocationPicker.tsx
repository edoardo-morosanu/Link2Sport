"use client";

import { useState, useEffect, useRef } from "react";

export interface CityLocationData {
  name: string;
  country: string;
  state?: string;
  displayName: string;
  latitude: number;
  longitude: number;
}

// MapTiler API response interfaces
interface MapTilerContextItem {
  place_designation?: string;
  text_en?: string;
  text?: string;
  country_code?: string;
}

interface MapTilerProperties {
  country_code?: string;
}

interface MapTilerGeometry {
  coordinates: [number, number];
}

interface MapTilerFeature {
  text?: string;
  place_name?: string;
  properties?: MapTilerProperties;
  geometry: MapTilerGeometry;
  context?: MapTilerContextItem[];
}

interface MapTilerResponse {
  features?: MapTilerFeature[];
}

// Nominatim API response interfaces
interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  country?: string;
  state?: string;
  region?: string;
  province?: string;
}

interface NominatimItem {
  address?: NominatimAddress;
  display_name?: string;
  lat: string;
  lon: string;
}

interface CityLocationPickerProps {
  value?: CityLocationData | null;
  onChange: (location: CityLocationData | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  mapTilerApiKey?: string;
  country?: string | null;
  required?: boolean;
  error?: string;
}

export function CityLocationPicker({
  value,
  onChange,
  placeholder = "Search for a city...",
  disabled = false,
  className = "",
  mapTilerApiKey,
  country = null,
  required = false,
  error = "",
}: CityLocationPickerProps) {
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState<CityLocationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [internalError, setInternalError] = useState<string | null>(null);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Clear search input when value changes externally
  useEffect(() => {
    if (value) {
      setSearchInput("");
    }
  }, [value]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // MapTiler geocoding API call
  const searchMapTiler = async (
    query: string,
    signal: AbortSignal,
  ): Promise<CityLocationData[]> => {
    if (!mapTilerApiKey) {
      throw new Error("MapTiler API key not available");
    }

    const url = new URL(
      "https://api.maptiler.com/geocoding/" +
        encodeURIComponent(query) +
        ".json",
    );
    url.searchParams.append("key", mapTilerApiKey);
    url.searchParams.append("types", "municipality,locality,place"); // Only municipalities/cities/towns
    url.searchParams.append("limit", "8");
    url.searchParams.append("autocomplete", "true");
    url.searchParams.append("fuzzyMatch", "true");

    if (country && country.trim()) {
      url.searchParams.append("country", country);
    }

    const response = await fetch(url.toString(), { signal });

    if (!response.ok) {
      throw new Error(`MapTiler API error: ${response.status}`);
    }

    const data: MapTilerResponse = await response.json();

    const results: CityLocationData[] = [];

    if (data.features) {
      for (const feature of data.features) {
        const properties = feature.properties || {};
        const geometry = feature.geometry;

        // Extract place components from the feature structure
        const placeName = feature.text || feature.place_name?.split(",")[0];
        const fullPlaceName = feature.place_name || "";

        // Skip if no valid place name
        if (!placeName) {
          continue;
        }

        // Extract country and region from context or place_name
        const contextItems = feature.context || [];
        const countryContext = contextItems.find(
          (item: MapTilerContextItem) =>
            item.place_designation === "country" ||
            item.text_en ||
            item.country_code,
        );
        const regionContext = contextItems.find(
          (item: MapTilerContextItem) =>
            item.place_designation === "state" ||
            item.place_designation === "region",
        );

        const country =
          countryContext?.text_en ||
          countryContext?.text ||
          properties.country_code?.toUpperCase() ||
          "";
        const state = regionContext?.text_en || regionContext?.text;

        // Create display name using the full place_name from API or construct it
        let displayName = fullPlaceName;
        if (!displayName) {
          displayName = placeName;
          if (state && state !== placeName) {
            displayName += `, ${state}`;
          }
          if (country && country !== placeName && country !== state) {
            displayName += `, ${country}`;
          }
        }

        results.push({
          name: placeName,
          country: country,
          state: state,
          displayName,
          latitude: geometry.coordinates[1],
          longitude: geometry.coordinates[0],
        });
      }
    }

    return results;
  };

  // OpenStreetMap Nominatim API call (fallback)
  const searchOpenStreetMap = async (
    query: string,
    signal: AbortSignal,
  ): Promise<CityLocationData[]> => {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.append("q", query);
    url.searchParams.append("format", "json");
    url.searchParams.append("addressdetails", "1");
    url.searchParams.append("limit", "8");

    // Only search for cities, towns, villages
    url.searchParams.append("class", "place");
    url.searchParams.append("type", "city,town,village");

    if (country && country.trim()) {
      url.searchParams.append("countrycodes", country);
    }

    const response = await fetch(url.toString(), {
      signal,
      headers: {
        "User-Agent": "Link2Sport/1.0 (contact@link2sport.com)", // Required by Nominatim
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data: NominatimItem[] = await response.json();

    const results: CityLocationData[] = [];

    for (const item of data) {
      const address = item.address || {};
      const placeName =
        address.city ||
        address.town ||
        address.village ||
        item.display_name?.split(",")[0];
      const country = address.country;
      const state = address.state || address.region || address.province;

      // Skip if no valid place name
      if (!placeName) {
        continue;
      }

      const lat = parseFloat(item.lat);
      const lon = parseFloat(item.lon);

      // Skip if coordinates are invalid
      if (isNaN(lat) || isNaN(lon)) {
        continue;
      }

      // Create display name
      let displayName = placeName;
      if (state && state !== placeName) {
        displayName += `, ${state}`;
      }
      if (country && country !== placeName) {
        displayName += `, ${country}`;
      }

      results.push({
        name: placeName,
        country: country || "",
        state: state,
        displayName,
        latitude: lat,
        longitude: lon,
      });
    }

    return results;
  };

  // Combined search with fallback
  const searchLocations = async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    setInternalError(null);

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      let results: CityLocationData[] = [];

      // Try MapTiler first
      try {
        results = await searchMapTiler(query, signal);
      } catch (mapTilerError) {
        console.warn("MapTiler failed, trying OpenStreetMap:", mapTilerError);

        // Fallback to OpenStreetMap
        try {
          results = await searchOpenStreetMap(query, signal);
        } catch (osmError) {
          console.error("Both geocoding services failed:", osmError);
          setInternalError("Unable to search locations. Please try again.");
          return;
        }
      }

      if (!signal.aborted) {
        setSuggestions(results);
        setSelectedIndex(-1);
      }
    } catch (error) {
      if (!signal.aborted) {
        console.error("Location search error:", error);
        setInternalError("Search failed. Please try again.");
        setSuggestions([]);
      }
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchInput(newValue);
    setShowSuggestions(true);
    setSelectedIndex(-1);

    // If user starts typing and there was a selected location, clear it
    if (value) {
      onChange(null);
    }

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      searchLocations(newValue);
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelect = (location: CityLocationData) => {
    onChange(location);
    setSearchInput("");
    setShowSuggestions(false);
    setSelectedIndex(-1);
    setSuggestions([]);
  };

  const handleClear = () => {
    onChange(null);
    setSearchInput("");
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleFocus = () => {
    setShowSuggestions(true);
    if (searchInput.trim().length >= 2) {
      searchLocations(searchInput);
    }
  };

  const handleBlur = () => {
    // Delay hiding to allow clicking on suggestions
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 150);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={value && !showSuggestions ? value.displayName : searchInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={value ? "" : placeholder}
          disabled={disabled}
          required={required}
          className={`w-full px-4 py-4 bg-gray-50 dark:bg-gray-700/50 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 hover:border-gray-300 dark:hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed ${
            error
              ? "border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500"
              : "border-gray-200 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
          } ${className}`}
        />

        {/* Clear button overlay when location is selected */}
        {value && !showSuggestions && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2 flex-shrink-0"
              disabled={disabled}
            >
              ×
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions &&
        (!value || searchInput.trim() !== "") &&
        (suggestions.length > 0 || loading || internalError) && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg max-h-60 overflow-y-auto">
            {internalError && (
              <div className="px-4 py-3 text-red-600 dark:text-red-400 text-sm">
                {internalError}
              </div>
            )}

            {loading && !internalError && (
              <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                Searching cities...
              </div>
            )}

            {!loading &&
              !internalError &&
              suggestions.length === 0 &&
              searchInput.trim().length >= 2 && (
                <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm">
                  No cities found for &quot;{searchInput}&quot;
                </div>
              )}

            {suggestions.map((location, index) => (
              <button
                key={`${location.latitude}-${location.longitude}-${index}`}
                type="button"
                onClick={() => handleSelect(location)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full px-4 py-3 text-left transition-colors duration-200 first:rounded-t-xl last:rounded-b-xl ${
                  selectedIndex === index
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                }`}
              >
                <div className="font-medium">{location.name}</div>
                {location.state || location.country ? (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {[location.state, location.country]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                ) : null}
              </button>
            ))}
          </div>
        )}

      {/* Error Message */}
      {error && (
        <div className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
