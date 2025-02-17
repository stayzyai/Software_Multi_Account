import React from "react";

const ListingShimmer = () => {
  return (
    <div className="mx-4 md:mx-10 p-4 rounded-lg shadow-sm bg-white border border-gray-200 animate-pulse mt-10 md:mt-20">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6 md:gap-2 mb-4">
        <div className="h-6 bg-gray-300 rounded w-24 sm:w-40"></div>
        <div className="h-6 bg-gray-300 rounded w-full"></div>
        <div className="h-6 bg-gray-300 rounded w-20 sm:w-40 hidden md:block"></div>
        <div className="h-6 bg-gray-300 rounded w-16 sm:w-40 hidden lg:block"></div>
      </div>
      <div className="space-y-4 md:space-y-6">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-1 px-6">
            <div className="h-12 w-12 lg:ml-8 bg-gray-200 rounded-full"></div>
            <div className="h-5 bg-gray-200 rounded md:w-40"></div>
            <div className="h-5 ml-6 bg-green-100 md:w-24 rounded-2xl"></div>
            <div className="h-5 bg-gray-200 rounded w-54 hidden md:block"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListingShimmer;
