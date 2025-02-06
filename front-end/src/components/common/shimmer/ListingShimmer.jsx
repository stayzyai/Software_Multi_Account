import React from "react";

const ListingShimmer = () => {
  return (
    <div className="mx-10 p-4 rounded-lg shadow-sm bg-white border border-gray-200 animate-pulse mt-20">
      {/* Table Header */}
      <div className="grid grid-cols-5 gap-6 mb-4">
        <div className="h-6 bg-gray-300 rounded w-32"></div>
        <div className="h-6 bg-gray-300 rounded w-full"></div>
        <div className="h-6 bg-gray-300 rounded w-24"></div>
        <div className="h-6 bg-gray-300 rounded w-20"></div>
        <div className="h-6 bg-gray-300 rounded w-24"></div>
      </div>
      <div className="space-y-6">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="grid grid-cols-5 gap-4">
            <div className="h-5 bg-gray-200 rounded w-3/4"></div>
            <div className="h-5 bg-gray-200 rounded w-full"></div>
            <div className="h-5 ml-6 bg-green-100 w-16 rounded-2xl"></div>
            <div className="h-5 bg-gray-200 rounded w-20"></div>
            <div className="h-5 bg-gray-200 rounded w-24"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListingShimmer;