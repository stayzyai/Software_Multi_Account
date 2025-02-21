import MessageRightSidebar from "./MessageRightSidebr"

const ChatShimmer = () => {
  return (
    <div className="flex h-screen w-full bg-white">
      {/* Left Sidebar - Conversations */}
      <div className="xl:w-80 lg:w-52 w-44 hidden border-r md:flex flex-col">
        {/* Search bar */}
        <div className="p-4 border-b">
          <div className="h-10 bg-gray-200 rounded-md relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent" />
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4 border-b">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gray-200 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent" />
              <div className="flex-1 space-y-2">
                {/* Name */}
                <div className="h-4 w-24 bg-gray-200 rounded relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent" />
                {/* Preview text */}
                <div className="h-3 w-40 bg-gray-200 rounded relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent" />
              </div>
              {/* Time */}
              <div className="h-3 w-12 bg-gray-200 rounded relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat messages */}
        <div className="flex-1 p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`flex ${
                i % 2 === 0 ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] ${i % 2 === 0 ? "ml-auto" : "mr-auto"}`}
              >
                <div className="h-24 xl:w-80 w-52 bg-gray-200 rounded-lg relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent" />
                <div className="h-3 w-20 bg-gray-200 mt-2 rounded relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent" />
              </div>
            </div>
          ))}
        </div>
        {/* Input area */}
        <div className="p-4 border-t">
          <div className="h-12 bg-gray-200 rounded-lg relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent" />
        </div>
      </div>

      {/* Right Sidebar - Booking Details */}
      <MessageRightSidebar />
    </div>
  );
};

export default ChatShimmer;
