"use client";

import React, { useEffect, useCallback, useState } from "react";
import { usePaginatedFollowing } from "@/hooks/useFollow";
import { FollowListProps, FollowingUser } from "@/types/follow";

interface ExtendedFollowListProps extends FollowListProps {
  hideHeader?: boolean;
}
import { useAuth } from "@/contexts/AuthContext";
import FollowButton from "./FollowButton";
import styles from "./FollowingList.module.css";

const FollowingList: React.FC<ExtendedFollowListProps> = ({
  userId,
  isVisible = true,
  onUserClick = () => {},
  showFollowButtons = true,
  className = "",
  hideHeader = false,
}) => {
  const { user: currentUser } = useAuth();
  const {
    users: following,
    loading,
    error,
    hasNext,
    totalCount,
    loadFollowing,
    loadMore,
    refresh,
  } = usePaginatedFollowing(userId);

  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  useEffect(() => {
    if (isVisible && userId) {
      loadFollowing(1, false);
    }
  }, [userId, isVisible, loadFollowing]);

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
      console.error("Failed to refresh following:", error);
    }
  };

  const handleFollowChange = (userId: number, isFollowing: boolean): void => {
    // Update the local state to reflect follow status change
    // This is optional - you might want to refresh the list or update individual items
    console.log(`User ${userId} follow status changed to: ${isFollowing}`);
  };

  const handleUserClick = (user: FollowingUser): void => {
    // If it's the current user, redirect to their own profile page
    if (currentUser && user.id.toString() === currentUser.id) {
      window.location.href = "/profile";
      return;
    }
    onUserClick(user);
  };

  const isCurrentUser = (user: FollowingUser): boolean => {
    return currentUser ? user.id.toString() === currentUser.id : false;
  };

  if (!isVisible) {
    return null;
  }

  if (loading && following.length === 0) {
    return (
      <div className={`${styles.container} ${className}`}>
        {!hideHeader && (
          <div className={styles.header}>
            <h3>Following ({totalCount || 0})</h3>
          </div>
        )}
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading following...</p>
        </div>
      </div>
    );
  }

  if (error && following.length === 0) {
    return (
      <div className={`${styles.container} ${className}`}>
        {!hideHeader && (
          <div className={styles.header}>
            <h3>Following</h3>
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
          <p>Failed to load following</p>
          <p className={styles.errorMessage}>{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className}`}>
      {!hideHeader && (
        <div className={styles.header}>
          <h3>Following ({totalCount})</h3>
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

      {following.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>👤</div>
          <h4>Not following anyone yet</h4>
          <p>When this user follows someone, they'll appear here.</p>
        </div>
      ) : (
        <div className={styles.listContainer} onScroll={handleScroll}>
          <div className={styles.items}>
            {following.map((user) => (
              <div key={user.id} className={styles.item}>
                <div
                  className={styles.profile}
                  onClick={() => handleUserClick(user)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleUserClick(user);
                    }
                  }}
                >
                  <div className={styles.avatar}>
                    {user.has_avatar && user.avatar_url ? (
                      <img
                        src={`/api/proxy-avatar?src=${encodeURIComponent(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}${user.avatar_url}`)}`}
                        alt={`${user.display_name}'s avatar`}
                        className={styles.avatarImage}
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.onerror = null;
                          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || user.display_name || "User")}&size=200&background=3b82f6&color=fff`;
                        }}
                      />
                    ) : (
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || user.display_name || "User")}&size=200&background=3b82f6&color=fff`}
                        alt={`${user.display_name}'s avatar`}
                        className={styles.avatarImage}
                      />
                    )}
                  </div>

                  <div className={styles.info}>
                    <h4 className={styles.name}>
                      {user.display_name || user.username}
                    </h4>
                    <p className={styles.username}>@{user.username}</p>
                    <p className={styles.followDate}>
                      Following since{" "}
                      {new Date(user.followed_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className={styles.actions}>
                  {showFollowButtons && !isCurrentUser(user) && (
                    <FollowButton
                      userId={user.id}
                      initialFollowStatus={true}
                      onFollowChange={(isFollowing) =>
                        handleFollowChange(user.id, isFollowing)
                      }
                      size="small"
                      variant="secondary"
                    />
                  )}

                  {isCurrentUser(user) && (
                    <span className={styles.mutualBadge}>You</span>
                  )}

                  {!isCurrentUser(user) && user.follows_back && (
                    <span className={styles.mutualBadge}>Follows back</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Loading more indicator */}
          {(isLoadingMore || (loading && following.length > 0)) && (
            <div className={styles.loadingMore}>
              <div className={`${styles.spinner} ${styles.small}`}></div>
              <span>Loading more...</span>
            </div>
          )}

          {/* End of list indicator */}
          {!hasNext && following.length > 0 && (
            <div className={styles.endMessage}>
              <p>You've reached the end of the list</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FollowingList;
