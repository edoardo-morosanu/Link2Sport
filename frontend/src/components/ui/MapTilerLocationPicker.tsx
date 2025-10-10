"use client";

import { useState, useEffect, useRef } from "react";

// TypeScript declarations for MapLibre GL
declare global {
  interface Window {
    maplibregl: {
      Map: any;
      Marker: any;
      Popup: any;
      NavigationControl: any;
      GeolocateControl: any;
    };
  }
}

// MapLibre types
interface MapLibreMap {
  addControl: (control: any, position?: string) => void;
  on: (event: string, callback: (e?: any) => void) => void;
  flyTo: (options: { center: [number, number]; zoom: number }) => void;
  remove: () => void;
}

interface MapLibreMarker {
  setLngLat: (lngLat: [number, number]) => MapLibreMarker;
  addTo: (map: MapLibreMap) => MapLibreMarker;
  setPopup: (popup: any) => MapLibreMarker;
  remove: () => void;
}

interface MapMouseEvent {
  lngLat: { lng: number; lat: number };
}

interface LocationData {
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
}

interface MapTilerFeature {
  id: string;
  text: string;
  place_name: string;
  center: [number, number]; // [longitude, latitude]
  geometry: {
    coordinates: [number, number];
  };
  properties: {
    country_code?: string;
    kind?: string;
    categories?: string[];
  };
  bbox?: [number, number, number, number];
  relevance: number;
}

interface MapTilerLocationPickerProps {
  value?: LocationData;
  onChange: (location: LocationData) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  apiKey?: string; // MapTiler API key
  country?: string; // Optional country filter (e.g., 'nl' for Netherlands)
  showMap?: boolean;
  mapHeight?: string;
  language?: string; // Language preference (e.g., 'en', 'nl')
}

export function MapTilerLocationPicker({
  value,
  onChange,
  placeholder = "Search for a location...",
  disabled = false,
  className = "",
  apiKey,
  country,
  showMap = true,
  mapHeight = "300px",
  language = "en",
}: MapTilerLocationPickerProps) {
  const [query, setQuery] = useState(value?.name || "");
  const [suggestions, setSuggestions] = useState<MapTilerFeature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const debounceRef = useRef<NodeJS.Timeout>();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<MapLibreMarker | null>(null);

  // Get user's current location for map centering
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // Default to Amsterdam, Netherlands if geolocation fails
          setUserLocation({ lat: 52.3676, lng: 4.9041 });
        },
      );
    } else {
      setUserLocation({ lat: 52.3676, lng: 4.9041 });
    }
  }, []);

  // Load map when component mounts and we have location
  useEffect(() => {
    if (!showMap || !mapRef.current || !userLocation) return;

    const loadMap = async () => {
      try {
        // Load MapLibre GL CSS
        const link = document.createElement("link");
        link.href = "https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css";
        link.rel = "stylesheet";
        document.head.appendChild(link);

        // Load MapLibre GL JS
        const script = document.createElement("script");
        script.src = "https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js";
        script.onload = initializeMap;
        document.head.appendChild(script);
      } catch (error) {
        console.error("Failed to load map library:", error);
      }
    };

    const initializeMap = () => {
      if (
        typeof window !== "undefined" &&
        (window as any).maplibregl &&
        mapRef.current
      ) {
        const maplibregl = (window as any).maplibregl;

        try {
          // Create map style URL
          const styleUrl = apiKey
            ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}`
            : "https://demotiles.maplibre.org/style.json"; // Free fallback

          const map = new maplibregl.Map({
            container: mapRef.current,
            style: styleUrl,
            center: value
              ? [value.longitude, value.latitude]
              : [userLocation.lng, userLocation.lat],
            zoom: value ? 14 : 11,
            attributionControl: true,
          });

          // Add navigation controls
          map.addControl(new maplibregl.NavigationControl(), "top-right");

          // Add geolocate control
          map.addControl(
            new maplibregl.GeolocateControl({
              positionOptions: { enableHighAccuracy: true },
              trackUserLocation: false,
              showUserHeading: false,
            }),
            "top-right",
          );

          map.on("load", () => {
            setMapLoaded(true);

            // Add existing marker if value exists
            if (value) {
              addMarker(
                maplibregl,
                map,
                value.latitude,
                value.longitude,
                value.name,
              );
            }
          });

          // Handle map clicks
          map.on("click", async (e: MapMouseEvent) => {
            if (disabled) return;

            const { lng, lat } = e.lngLat;

            // Remove existing marker
            try {
              if (markerRef.current) {
                markerRef.current.remove();
              }
            } catch (error) {
              console.log("Error removing marker on click:", error);
            }

            // Add new marker
            addMarker(maplibregl, map, lat, lng);

            // Reverse geocode
            await reverseGeocode(lat, lng);
          });

          mapInstanceRef.current = map;
        } catch (error) {
          console.error("Map initialization error:", error);
        }
      }
    };

    loadMap();

    return () => {
      try {
        if (markerRef.current) {
          markerRef.current.remove();
          markerRef.current = null;
        }
      } catch (error) {
        console.log("Error removing marker:", error);
      }

      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      } catch (error) {
        console.log("Error removing map:", error);
      }
    };
  }, [showMap, apiKey, userLocation, value, disabled]);

  const addMarker = (
    maplibregl: any,
    map: MapLibreMap,
    lat: number,
    lng: number,
    title?: string,
  ) => {
    try {
      if (markerRef.current) {
        markerRef.current.remove();
      }
    } catch (error) {
      console.log("Error removing existing marker:", error);
    }

    const marker = new maplibregl.Marker({
      color: "#3B82F6",
    })
      .setLngLat([lng, lat])
      .addTo(map);

    if (title) {
      marker.setPopup(
        new maplibregl.Popup({ offset: 25 }).setHTML(
          `<div class="p-2 text-sm">${title}</div>`,
        ),
      );
    }

    markerRef.current = marker;
  };

  // Search using MapTiler Geocoding API
  const searchLocations = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      if (apiKey) {
        // Use MapTiler Geocoding API with enhanced POI search
        const params = new URLSearchParams({
          key: apiKey,
          limit: "8",
          language: language,
          autocomplete: "true",
          fuzzyMatch: "true",
          types: "place,address,poi",
        });

        if (country) {
          params.append("country", country);
        }

        // Enhanced search: try direct search first
        let response = await fetch(
          `https://api.maptiler.com/geocoding/${encodeURIComponent(searchQuery)}.json?${params}`,
        );

        let data = null;
        if (response.ok) {
          data = await response.json();
        }

        // If we got few results and it looks like a POI search, try enhanced queries
        if (
          data?.features &&
          data.features.length < 3 &&
          !searchQuery.includes(",")
        ) {
          const enhancedQueries = [
            `${searchQuery} ${country ? (country === "nl" ? "Netherlands" : country) : ""}`,
            `cafe ${searchQuery}`,
            `restaurant ${searchQuery}`,
            `bar ${searchQuery}`,
            `gym ${searchQuery}`,
            `sports ${searchQuery}`,
          ];

          // Try each enhanced query and merge results
          const allFeatures = [...(data.features || [])];

          for (const enhancedQuery of enhancedQueries) {
            try {
              const enhancedParams = new URLSearchParams({
                key: apiKey,
                limit: "3",
                language: language,
                autocomplete: "true",
                fuzzyMatch: "true",
              });

              // Only add types if we're specifically searching for POIs
              if (
                enhancedQuery.includes("cafe") ||
                enhancedQuery.includes("restaurant") ||
                enhancedQuery.includes("bar") ||
                enhancedQuery.includes("gym") ||
                enhancedQuery.includes("sports")
              ) {
                enhancedParams.append("types", "poi");
              }

              if (country) {
                enhancedParams.append("country", country);
              }

              const enhancedResponse = await fetch(
                `https://api.maptiler.com/geocoding/${encodeURIComponent(enhancedQuery)}.json?${enhancedParams}`,
              );

              if (enhancedResponse.ok) {
                const enhancedData = await enhancedResponse.json();
                if (enhancedData.features) {
                  // Filter out duplicates and add new results
                  enhancedData.features.forEach((feature: MapTilerFeature) => {
                    const isDuplicate = allFeatures.some(
                      (existing) =>
                        existing.id === feature.id ||
                        (Math.abs(existing.center[0] - feature.center[0]) <
                          0.001 &&
                          Math.abs(existing.center[1] - feature.center[1]) <
                            0.001),
                    );
                    if (!isDuplicate) {
                      allFeatures.push(feature);
                    }
                  });
                }
              }
            } catch (error) {
              console.log("Enhanced search attempt failed:", error);
            }
          }

          // Update data with merged results, limit to 8 total
          data = {
            ...data,
            features: allFeatures.slice(0, 8),
          };
        }

        setSuggestions(data?.features || []);

        if (!response.ok) {
          console.error("MapTiler API error:", await response.text());
          // Fallback to OpenStreetMap
          await searchWithOSM(searchQuery);
        }
      } else {
        // Fallback to OpenStreetMap Nominatim
        await searchWithOSM(searchQuery);
      }
    } catch (error) {
      console.error("Search error:", error);
      // Fallback to OpenStreetMap
      await searchWithOSM(searchQuery);
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback search using OpenStreetMap Nominatim
  const searchWithOSM = async (searchQuery: string) => {
    try {
      const params = new URLSearchParams({
        format: "json",
        q: searchQuery,
        limit: "5",
        addressdetails: "1",
      });

      if (country) {
        params.append("countrycodes", country);
      }

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
      );

      if (response.ok) {
        const data = await response.json();
        // Convert OSM format to MapTiler format for consistency
        const converted = data.map((item: any, index: number) => ({
          id: `osm.${item.place_id}`,
          text: item.display_name.split(",")[0],
          place_name: item.display_name,
          center: [parseFloat(item.lon), parseFloat(item.lat)],
          geometry: {
            coordinates: [parseFloat(item.lon), parseFloat(item.lat)],
          },
          properties: {
            country_code: item.address?.country_code,
          },
          relevance: 1 - index * 0.1, // Simulate relevance scoring
        }));
        setSuggestions(converted);
      }
    } catch (error) {
      console.error("OSM search error:", error);
      setSuggestions([]);
    }
  };

  // Reverse geocoding
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      let locationName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

      if (apiKey) {
        // Use MapTiler reverse geocoding
        const response = await fetch(
          `https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${apiKey}&language=${language}`,
        );

        if (response.ok) {
          const data = await response.json();
          if (data.features?.[0]) {
            locationName = data.features[0].place_name;
          }
        }
      } else {
        // Fallback to OpenStreetMap
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        );

        if (response.ok) {
          const data = await response.json();
          if (data.display_name) {
            locationName = data.display_name;
          }
        }
      }

      const locationData: LocationData = {
        name: locationName,
        latitude: lat,
        longitude: lng,
        address: locationName,
      };

      setQuery(locationName);
      onChange(locationData);
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      onChange({
        name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        latitude: lat,
        longitude: lng,
      });
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    setUseCurrentLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Update map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo({
            center: [longitude, latitude],
            zoom: 15,
          });
        }

        // Add marker
        if (mapInstanceRef.current && (window as any).maplibregl) {
          addMarker(
            (window as any).maplibregl,
            mapInstanceRef.current,
            latitude,
            longitude,
          );
        }

        // Reverse geocode
        await reverseGeocode(latitude, longitude);
        setUseCurrentLocation(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Unable to get your location. Please search manually.");
        setUseCurrentLocation(false);
      },
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setShowSuggestions(true);
    setSelectedIndex(-1);

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce search
    debounceRef.current = setTimeout(() => {
      if (newQuery.trim()) {
        searchLocations(newQuery);
      } else {
        setSuggestions([]);
        setIsLoading(false);
      }
    }, 300);
  };

  const handleSuggestionClick = (suggestion: MapTilerFeature) => {
    const [longitude, latitude] = suggestion.center;

    const locationData: LocationData = {
      name: suggestion.place_name,
      latitude,
      longitude,
      address: suggestion.place_name,
    };

    setQuery(suggestion.place_name);
    onChange(locationData);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);

    // Update map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: [longitude, latitude],
        zoom: 15,
      });

      // Add marker
      if ((window as any).maplibregl && mapInstanceRef.current) {
        addMarker(
          (window as any).maplibregl,
          mapInstanceRef.current,
          latitude,
          longitude,
          suggestion.place_name,
        );
      }
    }
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
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const formatSuggestionText = (suggestion: MapTilerFeature) => {
    const parts = suggestion.place_name.split(", ");
    return {
      main: parts.slice(0, 2).join(", "),
      detail: parts.slice(2).join(", "),
    };
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full px-4 py-3 bg-gray-50/70 dark:bg-gray-700/30 backdrop-blur-sm border-2 border-gray-200/50 dark:border-gray-600/30 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-300/60 dark:hover:border-gray-500/40 hover:bg-gray-50/90 dark:hover:bg-gray-700/40 placeholder-gray-500 dark:placeholder-gray-400 pr-10"
            />

            {/* Search Icon */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {isLoading ? (
                <svg
                  className="animate-spin h-5 w-5 text-gray-400"
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
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              )}
            </div>
          </div>

          {/* Current Location Button */}
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={disabled || useCurrentLocation}
            className="px-4 py-3 bg-blue-50/70 dark:bg-blue-900/30 border-2 border-blue-200/50 dark:border-blue-700/30 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100/80 dark:hover:bg-blue-900/50 hover:border-blue-300/60 dark:hover:border-blue-600/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            title="Use current location"
          >
            {useCurrentLocation ? (
              <svg
                className="animate-spin h-5 w-5"
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
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            )}
            <span className="hidden sm:inline text-sm font-medium">GPS</span>
          </button>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg max-h-60 overflow-auto">
            {suggestions.map((suggestion, index) => {
              const { main, detail } = formatSuggestionText(suggestion);
              return (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-colors duration-150 border-b border-gray-100/50 dark:border-gray-600/30 last:border-b-0 ${
                    index === selectedIndex
                      ? "bg-blue-50/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "text-gray-900 dark:text-white"
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <svg
                      className="w-5 h-5 mt-0.5 text-gray-400 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{main}</div>
                      {detail && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {detail}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        {apiKey && suggestion.relevance && (
                          <div className="text-xs text-green-600 dark:text-green-400">
                            {Math.round(suggestion.relevance * 100)}% match
                          </div>
                        )}
                        {suggestion.properties?.categories &&
                          suggestion.properties.categories.length > 0 && (
                            <div className="text-xs text-blue-600 dark:text-blue-400">
                              {suggestion.properties.categories[0]}
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive Map */}
      {showMap && (
        <div className="relative rounded-xl overflow-hidden border-2 border-gray-200/50 dark:border-gray-600/30 bg-gray-100 dark:bg-gray-800">
          <div
            ref={mapRef}
            style={{ height: mapHeight }}
            className={`w-full ${disabled ? "pointer-events-none opacity-75" : ""}`}
          />

          {/* Loading Overlay */}
          {!mapLoaded && (
            <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <div className="text-center space-y-3">
                <svg
                  className="animate-spin h-8 w-8 text-blue-500 mx-auto"
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
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Loading map...
                </p>
              </div>
            </div>
          )}

          {/* Map Instructions */}
          {mapLoaded && !disabled && (
            <div className="absolute bottom-3 left-3 right-3">
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                  Click anywhere on the map to select a location • Use the
                  search box or GPS button for quick access
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selected Location Display */}
      {value && (
        <div className="bg-blue-50/80 dark:bg-blue-900/30 backdrop-blur-sm rounded-xl p-3 border border-blue-200/50 dark:border-blue-700/50">
          <div className="flex items-start space-x-3">
            <svg
              className="w-5 h-5 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-blue-900 dark:text-blue-100">
                Selected Location
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300 mt-1 truncate">
                {value.name}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                onChange({ name: "", latitude: 0, longitude: 0 });
                try {
                  if (markerRef.current) {
                    markerRef.current.remove();
                    markerRef.current = null;
                  }
                } catch (error) {
                  console.log("Error clearing marker:", error);
                }
              }}
              className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-200 transition-colors"
              title="Clear location"
            >
              <svg
                className="w-4 h-4"
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
        </div>
      )}
    </div>
  );
}
