const ActiveChat = ({ activeAccount }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg md:p-6 p-2 border border-gray-200 dark:border-gray-700 mb-10">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        Active Chats
      </h2>

      {/* Table Headers */}
      <div className="grid grid-cols-3 text-sm font-semibold text-gray-500 dark:text-gray-400 border-b pb-4 mb-2 sm:px-20">
        <div className="text-start">Guest Name</div>
        <div className="sm:text-center">Chat ID</div>
        <div className="sm:text-center">AI Enabled</div>
      </div>

      {/* Listing Details */}
      {activeAccount?.length > 0 ? (
        activeAccount?.map((chat, chatIndex) => (
          <div
            key={chatIndex}
            className="grid grid-cols-3 text-sm text-gray-900 dark:text-white py-1 border-b border-dashed last:border-none sm:px-20"
          >
            <div className="text-start">{chat.guestName || "Unknown"}</div>
            <div className="text-center">{chat.chatId || "—"}</div>
            <div className="text-center">
              <span
                className={`inline-block px-3 py-0.5 rounded-full text-sm font-medium ${
                  chat.ai_enabled
                    ? "bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100"
                    : "bg-yellow-200 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100"
                }`}
              >
                {chat.ai_enabled ? "Yes" : "No"}
              </span>
            </div>
          </div>
        ))
      ) : (
        <p className="text-md text-gray-600 dark:text-gray-400 italic mt-4 text-center">
          AI feature is not enabled for any chat.
        </p>
      )}
    </div>
  );
};

export default ActiveChat;
