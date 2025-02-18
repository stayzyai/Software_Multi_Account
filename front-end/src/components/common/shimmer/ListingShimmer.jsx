import React from "react";

const ListingShimmer = () => {
  return (
    <div className="mx-4 md:mx-10 p-4 rounded-2xl shadow-sm bg-white border border-gray-200 animate-pulse mt-10 md:mt-20 overflow-x-auto">
      <table className="w-full border-collapse min-w-max">
        <thead>
          <tr>
            {["Name", "Address", "Occupancy", "Issues", "AI"].map(
              (header, index) => (
                <th key={index} className="text-left p-3 font-semibold">
                  <div className="h-4 bg-gray-300 rounded w-24 animate-pulse"></div>
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {Array(8)
            .fill("")
            .map((_, index) => (
              <tr key={index} className="border-t">
                <td className="p-3 flex items-center">
                  <div className="h-8 w-8 bg-gray-200 rounded-full mr-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                </td>
                <td className="p-3">
                  <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                </td>
                <td className="p-3">
                  <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                </td>
                <td className="p-3">
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                </td>
                <td className="p-3">
                  <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default ListingShimmer;
