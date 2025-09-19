import React from 'react';
import { useConversationPolling } from '../../hooks/useConversationPolling';
import { useSmartPolling } from '../../hooks/useSmartPolling';
import StatusIndicator from './StatusIndicator';

/**
 * Test component to verify polling is working
 * This can be temporarily added to any page to test polling functionality
 */
const PollingTest = () => {
  const pollConversations = useConversationPolling();
  const { isActive, pollingInterval, lastUpdate, error, isPolling, triggerUpdate } = useSmartPolling(pollConversations, 10000); // 10 second intervals for testing

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border z-50">
      <h3 className="text-sm font-semibold mb-2">Polling Status</h3>
      <StatusIndicator 
        isPolling={isPolling}
        lastUpdate={lastUpdate}
        error={error}
        isActive={isActive}
        pollingInterval={pollingInterval}
      />
      <button 
        onClick={triggerUpdate}
        className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
      >
        Force Update
      </button>
    </div>
  );
};

export default PollingTest;
