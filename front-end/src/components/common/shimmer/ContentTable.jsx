import React from "react";

const ListingShimmer = ({title}) => {
  return (
    <div className="px-4 rounded-2xl shadow-md bg-white w-full border border-gray-300 pt-4 animate-pulse">
      <div className="overflow-hidden">
        <div className="grid grid-cols-3 gap-4 mb-4 pt-6">
          <div className="h-4 bg-gray-300 rounded w-full"></div>
          <div className="h-4 bg-gray-300 rounded w-full"></div>
          <div className="h-4 bg-gray-300 rounded w-full"></div>
        </div>
        <div className="space-y-5 pb-6">
          {[...Array(5)].map((_, index) => (
            <div key={index} className={`grid grid-cols-3 ${title="tasks" ? "gap-16" : "gap-40"}`}>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded">
                {index % 2 === 0 ? (
                  <div className="w-full h-full bg-gray-100 rounded" />
                ) : (
                  <div className="w-4/5 h-full bg-gray-200 rounded" />
                )}
              </div>
              <div className="h-4 bg-red-100 rounded-2xl w-20"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ListingShimmer;
