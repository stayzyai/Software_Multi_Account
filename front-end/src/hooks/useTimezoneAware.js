import { useState, useEffect } from 'react';
import { addTimezoneChangeListener } from '../helpers/Message';

/**
 * Custom hook that provides timezone-aware functionality
 * Automatically re-renders components when timezone changes
 */
export const useTimezoneAware = () => {
  const [forceUpdate, setForceUpdate] = useState(0);

  useEffect(() => {
    const removeListener = addTimezoneChangeListener(() => {
      // Force re-render to update all timestamps
      setForceUpdate(prev => prev + 1);
    });

    return removeListener;
  }, []);

  return {
    forceUpdate
  };
};

export default useTimezoneAware;
