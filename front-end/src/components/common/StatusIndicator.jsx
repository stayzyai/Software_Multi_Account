import React from 'react';
import { formatTimeWithTimezone } from '../../helpers/Message';

/**
 * Status indicator component for polling status
 */
const StatusIndicator = ({ isPolling, lastUpdate, error, isActive, pollingInterval }) => {
  const formatLastUpdate = (date) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return formatTimeWithTimezone(date.toISOString());
  };

  const getStatusColor = () => {
    if (error) return 'text-red-500';
    if (isPolling) return 'text-blue-500';
    if (isActive) return 'text-green-500';
    return 'text-gray-500';
  };

  const getStatusText = () => {
    if (error) return 'Update failed';
    if (isPolling) return 'Updating...';
    if (isActive) return 'Live';
    return 'Idle';
  };

  return (
    <div className="flex items-center space-x-2 text-xs text-gray-500">
      <div className="flex items-center space-x-1">
        <div className={`w-2 h-2 rounded-full ${
          error ? 'bg-red-500' : 
          isPolling ? 'bg-blue-500 animate-pulse' : 
          isActive ? 'bg-green-500' : 'bg-gray-400'
        }`}></div>
        <span className={getStatusColor()}>{getStatusText()}</span>
      </div>
      
      {lastUpdate && (
        <span className="text-xs opacity-75">
          {formatLastUpdate(lastUpdate)}
        </span>
      )}
      
      {pollingInterval && (
        <span className="text-xs opacity-50">
          ({Math.round(pollingInterval / 1000)}s)
        </span>
      )}
    </div>
  );
};

export default StatusIndicator;
