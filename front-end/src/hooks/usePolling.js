import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for polling data at regular intervals
 * @param {Function} callback - Function to call on each poll
 * @param {number} interval - Polling interval in milliseconds (default: 30000)
 * @param {Array} dependencies - Dependencies that should trigger polling restart
 */
export const usePolling = (callback, interval = 30000, dependencies = []) => {
  const savedCallback = useRef();
  const intervalRef = useRef();

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    const tick = () => {
      if (savedCallback.current) {
        savedCallback.current();
      }
    };

    if (interval !== null && interval > 0) {
      intervalRef.current = setInterval(tick, interval);
      return () => clearInterval(intervalRef.current);
    }
  }, [interval, ...dependencies]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
};

/**
 * Smart polling hook that adapts interval based on user activity
 */
export const useSmartPolling = (callback, baseInterval = 30000) => {
  const [pollingInterval, setPollingInterval] = useState(baseInterval);
  const [isActive, setIsActive] = useState(true);

  // Track user activity
  useEffect(() => {
    let inactivityTimer;

    const handleUserActivity = () => {
      setIsActive(true);
      setPollingInterval(15000); // Poll every 15s when active
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        setIsActive(false);
        setPollingInterval(60000); // Poll every 60s when inactive
      }, 120000); // 2 minutes of inactivity
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
      clearTimeout(inactivityTimer);
    };
  }, []);

  usePolling(callback, pollingInterval);

  return { isActive, pollingInterval };
};
