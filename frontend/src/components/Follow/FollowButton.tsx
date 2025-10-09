"use client";

import React, { useState, useEffect } from "react";
import { useFollow } from "@/hooks/useFollow";
import { FollowButtonProps } from "@/types/follow";
import styles from "./FollowButton.module.css";

const FollowButton: React.FC<FollowButtonProps> = ({
  userId,
  initialFollowStatus = false,
  onFollowChange = () => {},
  size = "medium",
  variant = "primary",
  disabled = false,
  className = "",
}) => {
  const [isFollowing, setIsFollowing] = useState<boolean>(
    initialFollowStatus || false,
  );
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [buttonWidth, setButtonWidth] = useState<number | null>(null);
  const { loading, error, followUser, unfollowUser, getFollowStatus } =
    useFollow();

  useEffect(() => {
    const loadFollowStatus = async (): Promise<void> => {
      try {
        const result = await getFollowStatus(userId);
        setIsFollowing(result.is_following);
      } catch (error) {
        console.error("Failed to load follow status:", error);
      }
    };

    if (userId && initialFollowStatus === null) {
      loadFollowStatus();
    }
  }, [userId, initialFollowStatus, getFollowStatus]);

  const handleFollowToggle = async (): Promise<void> => {
    if (loading || disabled) return;

    try {
      // Add haptic-like feedback
      setIsAnimating(true);

      // Store current width for smooth transition
      const button = document.querySelector(
        `[aria-label="${isFollowing ? "Unfollow user" : "Follow user"}"]`,
      ) as HTMLElement;
      if (button && !buttonWidth) {
        setButtonWidth(button.offsetWidth);
      }

      let result;
      if (isFollowing) {
        result = await unfollowUser(userId);
      } else {
        result = await followUser(userId);
      }

      setIsFollowing(result.is_following);
      onFollowChange(result.is_following);

      // Reset animation and width after completion
      setTimeout(() => {
        setIsAnimating(false);
        setButtonWidth(null);
      }, 600);
    } catch (error) {
      console.error("Follow action failed:", error);
      setIsAnimating(false);
      setButtonWidth(null);
    }
  };

  const getSizeClass = (): string => {
    switch (size) {
      case "small":
        return styles.small;
      case "large":
        return styles.large;
      default:
        return styles.medium;
    }
  };

  const getVariantClass = (): string => {
    const baseClass = isFollowing
      ? styles.following
      : variant === "secondary"
        ? styles.secondary
        : variant === "outline"
          ? styles.outline
          : styles.primary;

    return `${baseClass} ${isAnimating ? styles.animating : ""}`;
  };

  const getButtonText = (): string => {
    if (loading) {
      return isFollowing ? "Unfollowing..." : "Following...";
    }

    if (isFollowing) {
      return "Following";
    }

    return "Follow";
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  const getHoverText = (): string => {
    if (loading) return getButtonText();

    if (isFollowing) {
      return "Unfollow";
    }

    return "Follow";
  };

  const getButtonIcon = (): string => {
    if (isFollowing) {
      return "✓";
    }
    return "+";
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <button
        className={`${styles.button} ${getSizeClass()} ${getVariantClass()}`}
        onClick={handleFollowToggle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        disabled={loading || disabled}
        aria-label={isFollowing ? "Unfollow user" : "Follow user"}
        type="button"
        style={buttonWidth ? { width: `${buttonWidth}px` } : undefined}
        data-hovering={isHovering}
        data-animating={isAnimating}
      >
        {loading ? (
          <span className={styles.loader}>
            <span className={styles.spinner}></span>
            {getButtonText()}
          </span>
        ) : (
          <>
            <span
              className={`${styles.icon} ${isHovering ? styles.iconHover : ""}`}
            >
              {getButtonIcon()}
            </span>
            <span className={styles.text}>
              <span className={styles.defaultText}>{getButtonText()}</span>
              <span className={styles.hoverText}>{getHoverText()}</span>
            </span>
          </>
        )}
      </button>

      {error && (
        <div className={styles.error} role="alert">
          {error.message || "Action failed"}
        </div>
      )}
    </div>
  );
};

export default FollowButton;
