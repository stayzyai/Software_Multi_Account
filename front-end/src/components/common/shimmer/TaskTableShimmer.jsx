import React from "react";

const TaskTableShimmer = () => {
  return (
    <div className="w-full border rounded-xl p-4 overflow-x-auto">
      <table className="w-full border-collapse min-w-max">
        <thead>
          <tr>
            {["Issue", "Address", "Urgency", "Assigned", "Date"].map((header, index) => (
              <th key={index} className="text-left p-2 font-semibold">
                <div className="h-4 bg-gray-300 rounded w-24 animate-pulse"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array(10)
            .fill("")
            .map((_, index) => (
              <tr key={index} className="border-t">
                <td className="p-2">
                  <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                </td>
                <td className="p-2">
                  <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
                </td>
                <td className="p-2">
                  <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                </td>
                <td className="p-2">
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                </td>
                <td className="p-2">
                  <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default TaskTableShimmer;
