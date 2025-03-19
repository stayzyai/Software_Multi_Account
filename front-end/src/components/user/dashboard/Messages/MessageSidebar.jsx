import { markChatAsRead } from "../../../../store/notificationSlice";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";

const ChatSidebar = ({
  handleClickMessages,
  filters,
  filteredConversations,
  fromatedConversation,
}) => {
  const unreadChats = useSelector((state) => state.notifications.unreadChats);
  const { messageId } = useParams();
  const dispatch = useDispatch();

  const getFirstTwoWords = (name) => {
    const words = name?.split(" ");
    const firstTwoWords = words?.slice(0, 2).join(" ");
    return firstTwoWords;
  };
  const noMessages =
    filters?.quickFilter || filters?.selectedListing
      ? !filteredConversations?.length
      : !fromatedConversation?.length;

  return (
    <>
      <div className="space-y-4 overflow-y-scroll scrollbar-hide h-[calc(100vh-71px)] pb-4">
        {(filters.quickFilter !== "" || filters.selectedListing !== ""
          ? filteredConversations
          : fromatedConversation
        )?.map((item, index) => (
          <div
            key={index}
            onClick={() => {
              handleClickMessages(item?.id, fromatedConversation);
              dispatch(markChatAsRead({ chatId: item.id }));
            }}
            className={`flex items-center space-x-2 cursor-pointer mt-[14px] rounded-3xl w-full xl:px-3 px-2 h-12  ${
              unreadChats[item.id]
                ? "bg-green-100 hover:bg-green-100"
                : ` hover:bg-gray-50 active:bg-gray-100 ${
                    messageId == item.id ? "bg-gray-100" : "bg-white"
                  }`
            }`}
          >
            {item?.recipientPicture ? (
              <img
                className="w-10 h-10 rounded-full"
                src={item.recipientPicture}
                alt="Avatar"
              />
            ) : (
              <div className="w-[50px] h-[42px] rounded-full bg-green-800 flex items-center justify-center text-xl text-white font-semibold">
                {item?.recipientName[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex justify-between w-full text-[#292D32] text-nowrap text-base">
              <div>
                <p>{getFirstTwoWords(item?.recipientName)}</p>
                <div
                  className={`w-[124px] text-[#292D3270] text-xs overflow-hidden truncate whitespace-nowrap  ${
                    item?.isIncoming && "font-bold text-gray-700"
                  }`}
                >
                  {item?.conversationMessages !== ""
                    ? item?.conversationMessages
                    : "Click here to reply"}
                </div>
              </div>
              <div className="text-xs">{item?.latestMessageTime}</div>
            </div>
          </div>
        ))}
        {noMessages && (
          <div className="text-center text-gray-500 mt-10">
            {" "}
            No messages found{" "}
          </div>
        )}
      </div>
    </>
  );
};

export default ChatSidebar;
