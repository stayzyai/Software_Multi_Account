const ShimmerOverview = () => {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-lg text-black font-semibold bg-white p-2 rounded-2xl">Overview</h1>
        <div className="relative w-32 h-8 bg-gray-200 rounded-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 shimmer"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm p-6 relative overflow-hidden"
          >
            <div className="relative h-6 w-48 bg-gray-200 rounded mb-4 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 shimmer"></div>
            </div>
            <div className="relative h-10 w-20 bg-gray-200 rounded mb-4 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 shimmer"></div>
            </div>
            <div className="relative h-5 w-36 bg-gray-200 rounded overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 shimmer"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShimmerOverview;
