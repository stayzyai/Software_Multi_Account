import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { markChatAsRead } from "../../../../store/notificationSlice";
import { useState, useEffect } from "react";
import { formatSidebarTime } from "../../../../helpers/Message";
import useTimezoneAware from "../../../../hooks/useTimezoneAware";

const MessageList = ({
  title,
  simplifiedConversation,
  filteredConversations,
  handleClickMessages,
  selectedFilters,
  selectedIds,
  selectedListingIds
}) => {
  const [isFilteringActive, setFilteringActive] = useState(false);
  const unreadChats = useSelector((state) => state.notifications.unreadChats);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Use timezone-aware hook for dynamic timestamp updates
  const { forceUpdate } = useTimezoneAware();

  // Get timezone directly from Redux (same as settings page)
  const userProfile = useSelector((state) => state.user);
  const timezone = userProfile.timezone || "America/Chicago";

  useEffect(() => {
    const filterActive =
      selectedFilters.Date !== "" || selectedIds?.length !== 0 || selectedListingIds?.length != 0;
    setFilteringActive(filterActive);
  }, [selectedFilters, selectedIds, selectedListingIds]);

  useEffect(() => {
    // This effect runs when forceUpdate changes (timezone change)
    // It doesn't need to do anything, just trigger re-render
  }, [forceUpdate]);

  const getInitials = (name) => {
    let words = name?.trim().split(" ").slice(0, 1);
    return words
      ?.map((word) => word.charAt(0))
      .join("")
      .toUpperCase();
  };

  return (
    <>
      {simplifiedConversation?.length === 0 ? (
        <div className="px-6 py-3 text-gray-500 flex items-center justify-center text-center border-t min-h-64 text-xl">
          No messages found
        </div>
      ) : (
        <div className="divide-y mb-6 border-y border-gray-200 mx-4 min-h-60">
          {(title === "Dashboard"
            ? (isFilteringActive
                ? filteredConversations
                : simplifiedConversation
              )?.slice(0, 5)
            : isFilteringActive
            ? filteredConversations
            : simplifiedConversation
          )?.map((item, index) => (
            <div
              key={index}
              className={`items-center px-6 py-3 gap-4 hover:bg-gray-50 active:bg-gray-100 ${
                unreadChats[item.id] && "bg-green-100 hover:bg-green-100"
              }`}
            >
              <div className="flex items-center space-x-4">
                {item?.recipientPicture ? (
                  <img
                    className="w-10 h-10 rounded-full"
                    src={item?.recipientPicture}
                    alt="Avatar"
                  />
                ) : (
                  <div className="md:w-[38px] w-[44px] h-[36px] rounded-full bg-green-800 flex items-center justify-center text-xl text-white font-semibold">
                    {getInitials(item?.recipientName)}
                  </div>
                )}
                <div
                  onClick={() => {
                    title !== "Dashboard"
                      ? handleClickMessages(item.id, simplifiedConversation)
                      : navigate(`/user/chat/${item.id}`);
                    dispatch(markChatAsRead({ chatId: item.id }));
                  }}
                  className="cursor-pointer w-full"
                >
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-gray-800">
                      {item?.recipientName}
                    </p>
                    <p className="text-xs text-gray-500 ml-2">
                      {formatSidebarTime(item?.messageReceivedOn || item?.messageSentOn || item?.latestMessageTime, timezone)}
                    </p>
                  </div>
                  <p
                    className={`text-sm text-[#7F7F7F] hidden md:block ${
                      item?.isIncoming && "font-semibold text-gray-700"
                    }`}
                  >
                    {item?.conversationMessages}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default MessageList;
