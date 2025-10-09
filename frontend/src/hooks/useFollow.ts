import { useState, useCallback } from 'react';
import { FollowService } from '@/services/followService';
import {
  FollowResponse,
  FollowStatsResponse,
  FollowersListResponse,
  FollowingListResponse,
  FollowError,
  FollowHookState,
  PaginatedFollowState,
  FollowerUser,
  FollowingUser,
} from '@/types/follow';

export const useFollow = (): FollowHookState & {
  followUser: (userId: number) => Promise<FollowResponse>;
  unfollowUser: (userId: number) => Promise<FollowResponse>;
  getFollowStatus: (userId: number) => Promise<FollowResponse>;
  getFollowStats: (userId: number) => Promise<FollowStatsResponse>;
} => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<FollowError | null>(null);

  const followUser = useCallback(async (userId: number): Promise<FollowResponse> => {
    setLoading(true);
    setError(null);
    try {
      const result = await FollowService.followUser(userId);
      return result;
    } catch (error) {
      const followError = error as FollowError;
      setError(followError);
      throw followError;
    } finally {
      setLoading(false);
    }
  }, []);

  const unfollowUser = useCallback(async (userId: number): Promise<FollowResponse> => {
    setLoading(true);
    setError(null);
    try {
      const result = await FollowService.unfollowUser(userId);
      return result;
    } catch (error) {
      const followError = error as FollowError;
      setError(followError);
      throw followError;
    } finally {
      setLoading(false);
    }
  }, []);

  const getFollowStatus = useCallback(async (userId: number): Promise<FollowResponse> => {
    setLoading(true);
    setError(null);
    try {
      const result = await FollowService.getFollowStatus(userId);
      return result;
    } catch (error) {
      const followError = error as FollowError;
      setError(followError);
      throw followError;
    } finally {
      setLoading(false);
    }
  }, []);

  const getFollowStats = useCallback(async (userId: number): Promise<FollowStatsResponse> => {
    setLoading(true);
    setError(null);
    try {
      const result = await FollowService.getFollowStats(userId);
      return result;
    } catch (error) {
      const followError = error as FollowError;
      setError(followError);
      throw followError;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    followUser,
    unfollowUser,
    getFollowStatus,
    getFollowStats,
  };
};

export const usePaginatedFollowers = (userId: number): PaginatedFollowState<FollowerUser> & {
  loadFollowers: (page?: number, append?: boolean) => Promise<FollowersListResponse>;
  loadMore: () => Promise<FollowersListResponse | void>;
  refresh: () => Promise<FollowersListResponse>;
} => {
  const [users, setUsers] = useState<FollowerUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<FollowError | null>(null);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const loadFollowers = useCallback(async (
    page: number = 1,
    append: boolean = false
  ): Promise<FollowersListResponse> => {
    setLoading(true);
    setError(null);
    try {
      const result = await FollowService.getFollowers(userId, page, 20);

      if (append) {
        setUsers(prev => [...prev, ...result.users]);
      } else {
        setUsers(result.users);
      }

      setHasNext(result.has_next);
      setCurrentPage(result.page);
      setTotalCount(result.total_count);

      return result;
    } catch (error) {
      const followError = error as FollowError;
      setError(followError);
      throw followError;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadMore = useCallback(async (): Promise<FollowersListResponse | void> => {
    if (hasNext && !loading) {
      return loadFollowers(currentPage + 1, true);
    }
  }, [hasNext, loading, currentPage, loadFollowers]);

  const refresh = useCallback(async (): Promise<FollowersListResponse> => {
    setCurrentPage(1);
    return loadFollowers(1, false);
  }, [loadFollowers]);

  return {
    users,
    loading,
    error,
    hasNext,
    currentPage,
    totalCount,
    loadFollowers,
    loadMore,
    refresh,
  };
};

export const usePaginatedFollowing = (userId: number): PaginatedFollowState<FollowingUser> & {
  loadFollowing: (page?: number, append?: boolean) => Promise<FollowingListResponse>;
  loadMore: () => Promise<FollowingListResponse | void>;
  refresh: () => Promise<FollowingListResponse>;
} => {
  const [users, setUsers] = useState<FollowingUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<FollowError | null>(null);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const loadFollowing = useCallback(async (
    page: number = 1,
    append: boolean = false
  ): Promise<FollowingListResponse> => {
    setLoading(true);
    setError(null);
    try {
      const result = await FollowService.getFollowing(userId, page, 20);

      if (append) {
        setUsers(prev => [...prev, ...result.users]);
      } else {
        setUsers(result.users);
      }

      setHasNext(result.has_next);
      setCurrentPage(result.page);
      setTotalCount(result.total_count);

      return result;
    } catch (error) {
      const followError = error as FollowError;
      setError(followError);
      throw followError;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadMore = useCallback(async (): Promise<FollowingListResponse | void> => {
    if (hasNext && !loading) {
      return loadFollowing(currentPage + 1, true);
    }
  }, [hasNext, loading, currentPage, loadFollowing]);

  const refresh = useCallback(async (): Promise<FollowingListResponse> => {
    setCurrentPage(1);
    return loadFollowing(1, false);
  }, [loadFollowing]);

  return {
    users,
    loading,
    error,
    hasNext,
    currentPage,
    totalCount,
    loadFollowing,
    loadMore,
    refresh,
  };
};
