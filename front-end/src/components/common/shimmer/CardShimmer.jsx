const ShimmerOverview = () => {
  return (
    <div>
      {/* Pulsating Title */}
      <div className="w-40 h-10 bg-gray-100 rounded-lg animate-pulse"></div>

      {/* Grid Layout with Shimmer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 2xl:gap-16 p-6">
        {Array(4)
          .fill(0)
          .map((_, index) => (
            <div
              key={index}
              className="w-full h-32 2xl:h-36 rounded-lg border border-gray-300 bg-[linear-gradient(90deg,#f9fafb,#f3f4f6,#f9fafb)] bg-[length:200%_100%] animate-shimmer"
            ></div>
          ))}
      </div>
    </div>
  );
};

export default ShimmerOverview;
