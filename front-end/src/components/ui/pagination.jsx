import React from "react";

const Pagination = ({ currentPage, onPageChange, pageSize, totalItems }) => {
  const totalPages = Math.ceil(totalItems / pageSize);

  if (totalPages === 1) return null;

  return (
    <div className="flex justify-center items-center space-x-2 mt-4">
      {Array.from({ length: totalPages }, (_, index) => (
        <button
          key={index + 1}
          onClick={() => onPageChange(index + 1)}
          disabled={currentPage === index + 1}
          className={`px-4 py-2 text-sm font-medium leading-5 transition-colors duration-150 border border-gray-300 rounded-md focus:outline-none focus:shadow-outline-blue ${
            currentPage === index + 1
              ? "bg-green-800 text-white"
              : "text-green-800 bg-white hover:bg-green-100"
          }`}
        >
          {index + 1}
        </button>
      ))}
    </div>
  );
};

export default Pagination;
