"use client";

import { useState, useEffect } from "react";
import { SearchBar } from "./SearchBar";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-md cursor-pointer"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl animate-in slide-in-from-top-4 duration-300">
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-2xl overflow-visible">
          <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                🔍 Find People
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Search for users to connect with
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors duration-200"
            >
              <svg
                className="w-6 h-6 text-gray-400 dark:text-gray-500"
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
          <div className="p-6 overflow-visible">
            <SearchBar onClose={onClose} />
          </div>
        </div>
      </div>
    </div>
  );
}
