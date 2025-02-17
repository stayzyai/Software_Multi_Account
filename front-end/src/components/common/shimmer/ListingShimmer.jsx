import React from "react";

const ListingShimmer = () => {
  return (
    <div className="mx-4 md:mx-10 p-4 rounded-lg shadow-sm bg-white border border-gray-200 animate-pulse mt-10 md:mt-20">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6 mb-4">
        <div className="h-6 bg-gray-300 rounded w-24 sm:w-32"></div>
        <div className="h-6 bg-gray-300 rounded w-full"></div>
        <div className="h-6 bg-gray-300 rounded w-20 sm:w-24 hidden md:block"></div>
        <div className="h-6 bg-gray-300 rounded w-16 sm:w-20 hidden md:block"></div>
        <div className="h-6 bg-gray-300 rounded w-20 sm:w-24 hidden md:block"></div>
      </div>
      <div className="space-y-4 md:space-y-6">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            <div className="h-5 bg-gray-200 rounded w-3/4"></div>
            <div className="h-5 bg-gray-200 rounded w-full"></div>
            <div className="h-5 ml-6 bg-green-100 w-16 rounded-2xl hidden md:block"></div>
            <div className="h-5 bg-gray-200 rounded w-20 hidden md:block"></div>
            <div className="h-5 bg-gray-200 rounded w-24 hidden md:block"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListingShimmer;
