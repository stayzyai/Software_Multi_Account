import React, { useState } from 'react';

/**
 * Toggle component to easily switch between WebSocket and Polling
 * Add this to your main layout for easy testing
 */
const WebSocketToggle = () => {
  const [useWebSockets, setUseWebSockets] = useState(false);

  const toggleMode = () => {
    setUseWebSockets(!useWebSockets);
    // You can add logic here to actually switch between modes
  };

  return (
    <div className="fixed top-4 right-4 bg-white p-3 rounded-lg shadow-lg border z-50">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">Mode:</span>
        <button
          onClick={toggleMode}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            useWebSockets 
              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          {useWebSockets ? 'WebSocket (Disabled)' : 'Polling (Active)'}
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {useWebSockets ? 'WebSocket code is commented out' : 'Using polling every 30s'}
      </p>
    </div>
  );
};

export default WebSocketToggle;
