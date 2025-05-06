const ActiveChat = ({ activeAccount }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg md:p-6 p-2 border border-gray-200 dark:border-gray-700 mb-10">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        Active Chats
      </h2>
      {activeAccount?.length > 0 ? (
        <div className="space-y-6">
          {activeAccount.map((listing, idx) => (
            <div
              key={idx}
              className="border border-gray-200 dark:border-gray-700 rounded-lg md:p-6 p-2 bg-white dark:bg-gray-900 shadow-sm"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Listing Name : {listing?.name} ({listing?.id})
                </h2>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    listing?.listingSubscriptions
                      ? "bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100"
                      : "bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100"
                  }`}
                >
                  Subscription:{" "}
                  {listing?.listingSubscriptions ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Table Headers */}
              <div className="grid grid-cols-3 text-sm font-semibold text-gray-500 dark:text-gray-400 border-b pb-4 mb-2">
                <div>Guest Name</div>
                <div>Chat ID</div>
                <div>AI Enabled</div>
              </div>

              {/* Listing Details */}
              {listing?.listingdetails.length > 0 ? (
                listing?.listingdetails.map((chat, chatIndex) => (
                  <div
                    key={chatIndex}
                    className="grid grid-cols-3 text-sm text-gray-900 dark:text-white py-1 border-b border-dashed last:border-none"
                  >
                    <div>{chat.guestName || "Unknown"}</div>
                    <div>{chat.chatId || "—"}</div>
                    <div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          chat.ai_enabled
                            ? "bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100"
                        }`}
                      >
                        {chat.ai_enabled ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-2">
                  AI features are not enabled for this listing?.
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">
          No active chats found.
        </p>
      )}
    </div>
  );
};

export default ActiveChat;
