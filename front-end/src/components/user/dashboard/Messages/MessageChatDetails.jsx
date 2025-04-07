import MessageBookingDetails from "./MessageBookingDetails";
import ChatMessages from "./MessagesChat";
import Header from "../Header";

const MessageChatDetails = ({
  messages,
  setMessage,
  handleSendMessage,
  setInput,
  input,
  setOpenBooking,
  openBooking,
  setOpenSidebarMessage,
  openSidebarMessage,
  chatInfo,
  messageLoader,
}) => {
  return (
    <>
      <div className="flex-1 flex flex-col bg-[#FCFDFC]">
        <div className="border-b border-gray-400">
          <div className="flex pt- bg-white">
            <div className="2xl:w-[84%] xl:w-[52%] lg:w-[36%] w-[32%]">
              {chatInfo?.length > 0 &&
                chatInfo.map((item, index) => (
                  <div key={index} className="py-2 px-1 flex gap-2">
                    <div className="flex items-center gap-3">
                      {item?.recipientPicture ? (
                        <img
                          src={item?.recipientPicture}
                          alt="down icon"
                          className="rounded-full w-10 h-10"
                        />
                      ) : (
                        <div className="w-[42px] h-[42px] rounded-full text-gray-100 flex items-center justify-center text-xl bg-green-800 font-semibold">
                          {item?.recipientName?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                      <div>
                        <span className="text-[14px] text-nowrap font-normal">
                          {item?.recipientName || "Unknown"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            <div className="w-[50%] hidden lg:block">
              <Header title="Chat" messages={messages} />
            </div>
          </div>
        </div>
        <div className="flex min-h-[calc(100vh-71px)]">
          <ChatMessages
            messages={messages}
            setMessage={setMessage}
            handleSendMessage={handleSendMessage}
            setInput={setInput}
            input={input}
            setOpenBooking={setOpenBooking}
            openBooking={openBooking}
            setOpenSidebarMessage={setOpenSidebarMessage}
            openSidebarMessage={openSidebarMessage}
            chatInfo={chatInfo}
            messageLoader={messageLoader}
          />
          <MessageBookingDetails
            setOpenBooking={setOpenBooking}
            openBooking={openBooking}
            chatInfo={chatInfo}
          />
        </div>
      </div>
    </>
  );
};

export default MessageChatDetails;
