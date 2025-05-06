import React from "react";

const AccountDetailsShimmer = () => {
  return (
    <div className="p-6 border rounded-lg shadow-sm bg-white animate-pulse mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div className="h-6 w-1/4 bg-gray-300 rounded" />
        <div className="h-4 w-5 bg-gray-300 rounded" />
      </div>

      <div className="grid grid-cols-2 gap-6 mb-4">
        <div>
          <div className="h-4 w-20 bg-gray-300 rounded mb-1" />
          <div className="h-5 md:w-40 bg-gray-200 rounded" />
        </div>
        <div>
          <div className="h-4 w-20 bg-gray-300 rounded mb-1" />
          <div className="h-5 md:w-40 bg-gray-200 rounded" />
        </div>
        <div>
          <div className="h-4 w-20 bg-gray-300 rounded mb-1" />
          <div className="h-5 md:w-64 bg-gray-200 rounded" />
        </div>
        <div>
          <div className="h-4 w-12 bg-gray-300 rounded mb-1" />
          <div className="h-6 w-16 bg-gray-200 rounded-full" />
        </div>
      </div>

      <div className="mt-6">
        <div className="h-4 w-28 bg-gray-300 rounded mb-2" />
        <div className="h-20 w-20 bg-gray-200 rounded-full mb-2" />
        <div className="h-4 w-24 bg-gray-300 rounded" />
      </div>
    </div>
  );
};

export default AccountDetailsShimmer;
