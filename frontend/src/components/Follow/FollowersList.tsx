"use client";

import React, { useEffect, useCallback, useState } from "react";
import { usePaginatedFollowers } from "@/hooks/useFollow";
import { FollowListProps, FollowerUser } from "@/types/follow";

interface ExtendedFollowListProps extends FollowListProps {
  hideHeader?: boolean;
}
import { useAuth } from "@/contexts/AuthContext";
import FollowButton from "./FollowButton";
import styles from "./FollowersList.module.css";

const FollowersList: React.FC<ExtendedFollowListProps> = ({
  userId,
  isVisible = true,
  onUserClick = () => {},
  showFollowButtons = true,
  className = "",
  hideHeader = false,
}) => {
  const { user: currentUser } = useAuth();
  const {
    users: followers,
    loading,
    error,
    hasNext,
    totalCount,
    loadFollowers,
    loadMore,
    refresh,
  } = usePaginatedFollowers(userId);

  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  useEffect(() => {
    if (isVisible && userId) {
      loadFollowers(1, false);
    }
  }, [userId, isVisible, loadFollowers]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      const isNearBottom = scrollHeight - scrollTop <= clientHeight * 1.5;

      if (isNearBottom && hasNext && !loading && !isLoadingMore) {
        setIsLoadingMore(true);
        loadMore()?.finally(() => setIsLoadingMore(false));
      }
    },
    [hasNext, loading, isLoadingMore, loadMore],
  );

  const handleRefresh = async (): Promise<void> => {
    try {
      await refresh();
    } catch (error) {
      console.error("Failed to refresh followers:", error);
    }
  };

  const handleFollowChange = (userId: number, isFollowing: boolean): void => {
    // Update the local state to reflect follow status change
    // This is optional - you might want to refresh the list or update individual items
    console.log(`User ${userId} follow status changed to: ${isFollowing}`);
  };

  const handleUserClick = (follower: FollowerUser): void => {
    // If it's the current user, redirect to their own profile page
    if (currentUser && follower.id.toString() === currentUser.id) {
      window.location.href = "/profile";
      return;
    }
    onUserClick(follower);
  };

  const isCurrentUser = (follower: FollowerUser): boolean => {
    return currentUser ? follower.id.toString() === currentUser.id : false;
  };

  if (!isVisible) {
    return null;
  }

  if (loading && followers.length === 0) {
    return (
      <div className={`${styles.container} ${className}`}>
        {!hideHeader && (
          <div className={styles.header}>
            <h3>Followers ({totalCount || 0})</h3>
          </div>
        )}
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading followers...</p>
        </div>
      </div>
    );
  }

  if (error && followers.length === 0) {
    return (
      <div className={`${styles.container} ${className}`}>
        {!hideHeader && (
          <div className={styles.header}>
            <h3>Followers</h3>
            <button
              className={styles.refreshButton}
              onClick={handleRefresh}
              type="button"
            >
              Try Again
            </button>
          </div>
        )}
        <div className={styles.errorState} role="alert">
          <p>Failed to load followers</p>
          <p className={styles.errorMessage}>{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className}`}>
      {!hideHeader && (
        <div className={styles.header}>
          <h3>Followers ({totalCount})</h3>
          <button
            className={styles.refreshButton}
            onClick={handleRefresh}
            disabled={loading}
            type="button"
          >
            <span className={styles.refreshIcon}>↻</span>
            Refresh
          </button>
        </div>
      )}

      {followers.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>👥</div>
          <h4>No followers yet</h4>
          <p>When someone follows this user, they'll appear here.</p>
        </div>
      ) : (
        <div className={styles.listContainer} onScroll={handleScroll}>
          <div className={styles.items}>
            {followers.map((follower) => (
              <div key={follower.id} className={styles.item}>
                <div
                  className={styles.profile}
                  onClick={() => handleUserClick(follower)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleUserClick(follower);
                    }
                  }}
                >
                  <div className={styles.avatar}>
                    {follower.has_avatar && follower.avatar_url ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}${follower.avatar_url}`}
                        alt={`${follower.display_name}'s avatar`}
                        className={styles.avatarImage}
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.onerror = null;
                          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(follower.username || follower.display_name || "User")}&size=200&background=3b82f6&color=fff`;
                        }}
                      />
                    ) : (
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(follower.username || follower.display_name || "User")}&size=200&background=3b82f6&color=fff`}
                        alt={`${follower.display_name}'s avatar`}
                        className={styles.avatarImage}
                      />
                    )}
                  </div>

                  <div className={styles.info}>
                    <h4 className={styles.name}>
                      {follower.display_name || follower.username}
                    </h4>
                    <p className={styles.username}>@{follower.username}</p>
                    <p className={styles.followDate}>
                      Followed{" "}
                      {new Date(follower.followed_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className={styles.actions}>
                  {showFollowButtons && !isCurrentUser(follower) && (
                    <FollowButton
                      userId={follower.id}
                      initialFollowStatus={follower.is_following}
                      onFollowChange={(isFollowing) =>
                        handleFollowChange(follower.id, isFollowing)
                      }
                      size="small"
                      variant={follower.is_following ? "secondary" : "primary"}
                    />
                  )}

                  {isCurrentUser(follower) && (
                    <span className={styles.mutualBadge}>You</span>
                  )}

                  {!isCurrentUser(follower) && follower.is_following && (
                    <span className={styles.mutualBadge}>Follows you</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Loading more indicator */}
          {(isLoadingMore || (loading && followers.length > 0)) && (
            <div className={styles.loadingMore}>
              <div className={`${styles.spinner} ${styles.small}`}></div>
              <span>Loading more followers...</span>
            </div>
          )}

          {/* End of list indicator */}
          {!hasNext && followers.length > 0 && (
            <div className={styles.endMessage}>
              <p>You've reached the end of the list</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FollowersList;
