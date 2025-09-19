import { useState, useEffect, useCallback } from 'react';

/**
 * Smart polling hook that adapts interval based on user activity and data changes
 */
export const useSmartPolling = (callback, baseInterval = 30000) => {
  const [pollingInterval, setPollingInterval] = useState(baseInterval);
  const [isActive, setIsActive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);
  const [isPolling, setIsPolling] = useState(false);

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

  // Enhanced callback with error handling and status tracking
  const enhancedCallback = useCallback(async () => {
    if (isPolling) return; // Prevent overlapping polls
    
    setIsPolling(true);
    setError(null);
    
    try {
      await callback();
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
      console.error('Polling error:', err);
    } finally {
      setIsPolling(false);
    }
  }, [callback, isPolling]);

  // Set up polling
  useEffect(() => {
    if (pollingInterval <= 0) return;

    const interval = setInterval(enhancedCallback, pollingInterval);
    return () => clearInterval(interval);
  }, [pollingInterval, enhancedCallback]);

  return {
    isActive,
    pollingInterval,
    lastUpdate,
    error,
    isPolling,
    // Manual trigger for immediate update
    triggerUpdate: enhancedCallback
  };
};
