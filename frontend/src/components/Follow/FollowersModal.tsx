"use client";

import React from "react";
import FollowersList from "./FollowersList";
import { FollowerUser, FollowingUser } from "@/types/follow";
import { Modal } from "@/components/ui/Modal";

interface FollowersModalProps {
  isOpen: boolean;
  userId: number;
  onClose: () => void;
  onUserClick: (user: FollowerUser | FollowingUser) => void;
  showFollowButtons?: boolean;
}

export function FollowersModal({
  isOpen,
  userId,
  onClose,
  onUserClick,
  showFollowButtons = true,
}: FollowersModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Followers"
      variant="blue"
      size="md"
      icon={
        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      }
    >
      <div className="h-96">
        <FollowersList
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
