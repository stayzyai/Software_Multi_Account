import React from "react";

const ChatCardShimmer = () => {
  return (
    <div className="animate-pulse space-y-6">
      {[1, 2, 3, 4].map((_, index) => (
        <div key={index} className="p-6 border rounded-lg shadow-sm bg-white space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-4 w-1/3 bg-gray-300 rounded" />
            <div className="h-6 w-32 bg-gray-300 rounded-full" />
          </div>
          <div className="flex gap-6 text-sm font-semibold text-gray-500">
            <div className="h-4 w-1/5 bg-gray-300 rounded" />
            <div className="h-4 w-1/5 bg-gray-300 rounded" />
            <div className="h-4 w-1/5 bg-gray-300 rounded" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map((row) => (
              <div key={row} className="flex justify-between">
                <div className="h-4 w-1/4 bg-gray-300 rounded" />
                <div className="h-4 w-1/4 bg-gray-300 rounded" />
                <div className="h-4 w-1/6 bg-gray-300 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatCardShimmer;
