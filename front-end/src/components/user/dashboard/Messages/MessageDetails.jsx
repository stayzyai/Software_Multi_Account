import React, { useState, useEffect } from "react";
import Header from "../Header";
import MessageBookingDetails from "./MessageBookingDetails";
import ChatMessages from "./MessagesChat";
import { FiChevronsLeft } from "react-icons/fi";
import { sendMessages } from "../../../../helpers/Message"
import { toast } from "sonner";
import { simplifiedResult } from "../../../../helpers/Message";
import { useSelector } from "react-redux";
import { setMessages } from "../../../../store/messagesSlice";
import { useDispatch } from "react-redux";

const MessageDetails = ({ chatInfo, toggleSidebar, handleClickMessages, setOpenMessage, setChatInfo }) => {

  const conversation = useSelector((state)=>state.conversation.conversations)
  const  messsage = useSelector((state)=>state.messages)
  const [openBooking, setOpenBooking] = useState(false);
  const [openSidebarMessage, setOpenSidebarMessage] = useState(false);
  const [messages, setMessage] = useState([]);
  const [input, setInput] = useState("");
  const [messageLoader, setMessagesLoader] = useState(false)
  const [fromatedConversation, setFormatedConversation] = useState([])
  const dispatch = useDispatch()

useEffect(()=>{
  setFormatedConversation(simplifiedResult(conversation, messsage))
},[messages])

const getFirstTwoWords = (name)=>{
  const words = name?.split(' ');
  const firstTwoWords = words?.slice(0, 2).join(' ');
  return firstTwoWords
}
  const handleSendMessage = async(chat_id) => {
    if (input.trim()) {
      setMessagesLoader(true)
      const payload = { "body": input, "communicationType": "channel"}
      setInput("");
      const data = await sendMessages(chat_id, payload)
      if(data?.length > 0){
        setMessage([...messages, data[0]]);
        const currentChat = messsage?.find((item)=>item?.id === chat_id)
        const newMessages = [...(currentChat?.messages), data[0]];
        dispatch(setMessages({id: chat_id, message: newMessages}))
        toast.success("Messages sent")
        setMessagesLoader(false)
      }else{
        toast.error("An error occurred while sending messages. Please try again")
      }
    }
  };
  const handleCloseMessage = () => {
    setOpenMessage(false);
    setChatInfo({});
  }

  return (
    <div className="flex max-h-screen bg-[#fff]">
      {/* Sidebar with Messages */}
      <div className={`transition-all duration-300 ${ openSidebarMessage ? "z-50 sm:z-0 fixed sm:sticky top-[70px] sm:top-0 h-full sm:h-auto left-0 bg-white": "hidden md:block"} lg:w-[230px] xl:w-[257px] bg-[#FCFDFC] border-r border-gray-300`}>
        <div className="flex gap-2 pl-6 mt-4">
          <button onClick={handleCloseMessage}>
            <img src="/icons/left.svg" alt="down icon" width={12} height={10} />
          </button>
          <span style={{ "-webkit-text-stroke-width": "0.5px" }} className="text-2xl font-medium"> Messages </span>
        </div>
        <div className="flex justify-end mx-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="21"
            height="21"
            viewBox="0 0 21 21"
            fill="none"
          >
            <path
              d="M5.65385 10.5H15.3462M3.5 6.125H17.5M8.88461 14.875H12.1154"
              stroke="black"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <div className="space-y-4 overflow-y-scroll scrollbar-hide h-[calc(100vh-71px)] pb-4">
          {fromatedConversation?.map((item, index) => (
            <div key={index} onClick={()=>handleClickMessages(item?.id, fromatedConversation)} className="flex items-center space-x-2 cursor-pointer mt-[14px] bg-white rounded-3xl w-full xl:px-3 px-1 h-12">
              {item?.recipientPicture ? (<img className="w-10 h-10 rounded-full" src={item.recipientPicture} alt="Avatar"/>
              ):(<div className="w-[50px] h-[42px] rounded-full bg-green-800 flex items-center justify-center text-xl text-white font-semibold">
                  {item?.recipientName[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex justify-between w-full text-[#292D32] text-nowrap text-base">
                <div>
                  <p>{getFirstTwoWords(item?.recipientName)}</p>
                  <div className="w-[124px] text-[#292D3270] text-xs overflow-hidden truncate whitespace-nowrap">
                    {item?.conversationMessages !== ""? item?.conversationMessages: "Click here to reply"}
                  </div>
                </div>
                <div className="text-xs">{item?.messageReceivedOn}</div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => setOpenSidebarMessage(!openSidebarMessage)} className="bg-gray-100 p-1 py-2 rounded-lg ml-52 sm:hidden block absolute top-1/2">
          <FiChevronsLeft size={24} />
        </button>
      </div>
      {/* Chat Content Area */}
      <div className="flex-1 flex flex-col bg-[#FCFDFC]">
        <div className="border-b border-gray-400">
          <div className="flex pt-3 bg-white">
            <div className="2xl:w-[84%] xl:w-[52%] lg:w-[36%] w-[32%]">
              {chatInfo?.map((item, index) => (
                <div key={index}  className="p-2 flex gap-2">
                  <div className="flex items-center gap-3">
                    {item.recipientPicture ? <img src={item.recipientPicture} alt="down icon" className="rounded-full w-10 h-10"/>:<div className="w-[42px] h-[42px] rounded-full text-gray-100 flex items-center justify-center text-xl bg-green-800 font-semibold">{item?.recipientName[0].toUpperCase()}</div>}
                    <div>
                      <span className="text-[14px] text-nowrap font-normal">
                        {item?.recipientName}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="w-[40%] hidden lg:block">
              <Header title="Chat" messages={messages} toggleSidebar={toggleSidebar}
              />
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
    </div>
  );
};

export default MessageDetails;
