const ShimmerPayment = () => {
  return (
    <div className="space-y-8 border border-gray-200 rounded-lg">
      {/* Cards shimmer */}
      <div className="bg-white shadow-md rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
        <div className="space-y-4">
          {[1, 2].map((_, i) => (
            <div
              key={i}
              className="flex justify-between items-center border-b py-4"
            >
              <div className="w-full space-y-2">
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payments shimmer */}
      <div className="bg-white shadow-md rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((_, i) => (
            <div
              key={i}
              className="flex justify-between items-center border-b py-4"
            >
              <div className="w-full space-y-2">
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShimmerPayment