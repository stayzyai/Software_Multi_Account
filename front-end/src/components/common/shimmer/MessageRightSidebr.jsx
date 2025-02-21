const MessageRightSidebar = () => {
  return (
    <div className="w-80 lg:w-52 p-4 hidden lg:block">
      {/* Navigation tabs */}
      <div className="flex gap-4 border-b pb-4 mb-4">
        {["Booking", "Issues", "Upsell"].map((_, i) => (
          <div
            key={i}
            className="h-6 w-20 bg-gray-200 rounded relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent"
          />
        ))}
      </div>

      {/* Booking details */}
      <div className="space-y-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-24 bg-gray-200 rounded relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent" />
            <div className="h-6 w-40 bg-gray-200 rounded relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MessageRightSidebar