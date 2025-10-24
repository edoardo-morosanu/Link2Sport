"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SearchService } from "@/services/search";
import { AvatarService } from "@/services/avatar";
import { SearchUser } from "@/types/search";
import { useDebounce } from "@/hooks/useDebounce";

interface SearchBarProps {
  onClose?: () => void;
}

export function SearchBar({ onClose }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    async function performSearch() {
      if (debouncedQuery.length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await SearchService.searchUsers({
          q: debouncedQuery,
          limit: 8,
        });
        setResults(response.users);
        setIsOpen(true);
        setFocusedIndex(-1);
      } catch (error) {
        console.error("Search failed:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }

    performSearch();
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleUserClick = (user: SearchUser) => {
    router.push(`/user/${user.id}`);
    setIsOpen(false);
    setQuery("");
    onClose?.();
  };

  const handleInputFocus = () => {
    if (results.length > 0) {
      setIsOpen(true);
    }
  };

  const shouldHandleKeyDown = () => {
    return isOpen && results.length > 0;
  };

  const handleArrowDown = (e: React.KeyboardEvent) => {
    e.preventDefault();
    setFocusedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
  };

  const handleArrowUp = (e: React.KeyboardEvent) => {
    e.preventDefault();
    setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
  };

  const handleEnterKey = (e: React.KeyboardEvent) => {
    e.preventDefault();
    if (focusedIndex >= 0 && focusedIndex < results.length) {
      handleUserClick(results[focusedIndex]);
    }
  };

  const handleEscapeKey = () => {
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!shouldHandleKeyDown()) return;

    switch (e.key) {
      case "ArrowDown":
        handleArrowDown(e);
        break;
      case "ArrowUp":
        handleArrowUp(e);
        break;
      case "Enter":
        handleEnterKey(e);
        break;
      case "Escape":
        handleEscapeKey();
        break;
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto">
      {/* Search Input */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-500 animate-pulse" />

        <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-xl hover:shadow-2xl focus-within:shadow-2xl transition-all duration-300">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search for amazing people..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            className="w-full pl-16 pr-6 py-5 text-lg bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none rounded-2xl"
          />

          <div className="absolute left-6 top-1/2 transform -translate-y-1/2">
            {isLoading ? (
              <div className="relative">
                <div className="w-6 h-6 border-3 border-blue-200 dark:border-blue-800 rounded-full animate-spin" />
                <div className="absolute inset-0 w-6 h-6 border-3 border-transparent border-t-blue-500 rounded-full animate-spin" />
              </div>
            ) : (
              <svg
                className="w-6 h-6 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors duration-300"
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

          {query && (
            <button
              onClick={() => {
                setQuery("");
                setResults([]);
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="absolute right-6 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors duration-200"
            >
              <svg
                className="w-5 h-5 text-gray-400"
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
          )}
        </div>
      </div>

      {/* Search Results */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-4 z-[9999]">
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-4 fade-in duration-300">
            {results.length > 0 ? (
              <div className="max-h-80 overflow-y-auto">
                {results.map((user, index) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserClick(user)}
                    onMouseEnter={() => setFocusedIndex(index)}
                    className={`w-full px-4 py-3 flex items-center space-x-3 transition-all duration-200 group ${
                      focusedIndex === index
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-gray-200 dark:ring-gray-700 group-hover:ring-blue-300 dark:group-hover:ring-blue-600 transition-all duration-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={user.has_avatar
                            ? AvatarService.getAvatarUrl(user.id)
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.display_name || user.username || "User")}&size=200&background=3b82f6&color=fff`}
                          alt={`${user.display_name}'s avatar`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            target.onerror = null;
                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.display_name || user.username || "User")}&size=200&background=3b82f6&color=fff`;
                          }}
                        />
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 text-left min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                        {user.display_name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        @{user.username}
                      </p>
                    </div>

                    {/* Arrow Icon */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            ) : query.length >= 2 && !isLoading ? (
              <div className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                  No users found
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Try a different search term
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
