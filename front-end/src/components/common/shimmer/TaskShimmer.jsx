import React from "react";

const ShimmerTasks = () => {
  return (
    <div className="w-full p-4 border rounded-lg shadow-sm bg-white">
      <div className="flex justify-between items-center mb-4">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="flex space-x-2">
          <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {["Name", "Staff", "Status"].map((header, index) => (
              <th key={index} className="text-left py-2 px-4">
                <div className="h-4 w-20 bg-gray-300 rounded animate-pulse"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(5)].map((_, index) => (
            <tr key={index} className="border-b">
              <td className="py-3 px-4">
                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
              </td>
              <td className="py-3 px-4">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
              </td>
              <td className="py-3 px-4">
                <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ShimmerTasks;
