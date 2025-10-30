"use client";

import React from "react";
import FollowingList from "./FollowingList";
import { FollowingUser, FollowerUser } from "@/types/follow";
import { Modal } from "@/components/ui/Modal";

interface FollowingModalProps {
  isOpen: boolean;
  userId: number;
  onClose: () => void;
  onUserClick: (user: FollowingUser | FollowerUser) => void;
  showFollowButtons?: boolean;
}

export function FollowingModal({
  isOpen,
  userId,
  onClose,
  onUserClick,
  showFollowButtons = true,
}: FollowingModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Following"
      variant="emerald"
      size="md"
      icon={
        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A2.996 2.996 0 0 0 17.06 6c-.57 0-1.07.2-1.51.52L12.4 9.22c-.39.31-.64.78-.64 1.28v2.5H9v-3c0-.55-.45-1-1-1s-1 .45-1 1v12h2v-6h2v6h4v-6h2v6h2z" />
        </svg>
      }
    >
      <div className="h-96">
        <FollowingList
          userId={userId}
          isVisible={isOpen}
          onUserClick={onUserClick}
          showFollowButtons={showFollowButtons}
          hideHeader={true}
          className="h-full"
        />
      </div>
    </Modal>
  );
}
