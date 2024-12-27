const StatsCard = ({ icon, value, label, suffix }) => {
  return (
    <div className="bg-white rounded-lg p-3 md:p-4 shadow-xl">
      <div className="flex items-center gap-3 md:gap-4">
        <div className={`p-2 rounded-full ${icon.bgColor}`}>{icon.component}</div>
        <div className="min-w-0">
          <div className="flex items-baseline flex-wrap">
            <span className="text-xl md:text-2xl font-semibold truncate">
              {value}
            </span>
            {suffix && (
              <span className="text-gray-500 text-xs md:text-sm ml-1 truncate">
                {suffix}
              </span>
            )}
          </div>
          <p className="text-gray-600 text-xs md:text-sm truncate">{label}</p>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
