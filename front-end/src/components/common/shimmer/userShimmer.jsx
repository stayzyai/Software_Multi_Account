const Shimmer = () => {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 px-6">
        <div className="bg-gray-200 h-32 rounded-lg"></div>
        <div className="bg-gray-200 h-32 rounded-lg"></div>
        <div className="bg-gray-200 h-32 rounded-lg"></div>
      </div>
      <div className="bg-gray-200 h-6 w-3/4 rounded mb-6"></div>
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="grid grid-cols-3 gap-4 px-4 py-2 border-b border-gray-200"
        >
          <div className="h-6 bg-gray-300 rounded w-full"></div>
          <div className="h-6 bg-gray-300 rounded w-full"></div>
          <div className="h-6 bg-gray-300 rounded w-full"></div>
        </div>
      ))}
    </div>
  );
};

export default Shimmer;
