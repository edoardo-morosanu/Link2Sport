"use client";

import React from "react";
import { SearchBar } from "./SearchBar";
import { Modal } from "@/components/ui/Modal";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div>
          <div className="flex items-center gap-2">
            <span>Find People</span>
          </div>
          <p className="text-xs text-[var(--text-muted)]">Search for users to connect with</p>
        </div>
      }
      icon={
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
      }
      variant="neutral"
      size="lg"
    >
      <div className="p-6 overflow-visible">
        <SearchBar onClose={onClose} />
      </div>
    </Modal>
  );
}
