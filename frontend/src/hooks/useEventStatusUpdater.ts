import { useEffect, useRef, useCallback } from 'react';
import { EventService } from '@/services/event';

interface UseEventStatusUpdaterOptions {
  enabled?: boolean;
  pollInterval?: number; // in milliseconds
  onStatusUpdate?: (updatedEventsCount: number) => void;
  onError?: (error: Error) => void;
}

interface UseEventStatusUpdaterReturn {
  forceUpdate: () => Promise<void>;
  checkNeedingUpdate: () => Promise<number>;
  isRunning: boolean;
}

export const useEventStatusUpdater = ({
  enabled = true,
  pollInterval = 60000, // 1 minute default
  onStatusUpdate,
  onError,
}: UseEventStatusUpdaterOptions = {}): UseEventStatusUpdaterReturn => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRunningRef = useRef(false);

  const forceUpdate = useCallback(async () => {
    try {
      await EventService.updateEventStatuses();
      console.log('Event statuses updated successfully');

      // Optionally check how many events were updated
      if (onStatusUpdate) {
        const count = await EventService.checkEventsNeedingUpdate();
        onStatusUpdate(count);
      }
    } catch (error) {
      console.error('Error updating event statuses:', error);
      if (onError) {
        onError(error as Error);
      }
    }
  }, [onStatusUpdate, onError]);

  const checkNeedingUpdate = useCallback(async (): Promise<number> => {
    try {
      return await EventService.checkEventsNeedingUpdate();
    } catch (error) {
      console.error('Error checking events needing update:', error);
      if (onError) {
        onError(error as Error);
      }
      return 0;
    }
  }, [onError]);

  const startPolling = useCallback(() => {
    if (intervalRef.current || !enabled) return;

    isRunningRef.current = true;
    console.log(`Starting event status updater with ${pollInterval}ms interval`);

    // Run immediately
    forceUpdate();

    // Set up polling interval
    intervalRef.current = setInterval(async () => {
      await forceUpdate();
    }, pollInterval);
  }, [enabled, pollInterval, forceUpdate]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      isRunningRef.current = false;
      console.log('Event status updater stopped');
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      startPolling();
    } else {
      stopPolling();
    }

    // Cleanup on unmount
    return () => {
      stopPolling();
    };
  }, [enabled, startPolling, stopPolling]);

  // Handle visibility change - pause when tab is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else if (enabled) {
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, startPolling, stopPolling]);

  return {
    forceUpdate,
    checkNeedingUpdate,
    isRunning: isRunningRef.current,
  };
};

export default useEventStatusUpdater;
