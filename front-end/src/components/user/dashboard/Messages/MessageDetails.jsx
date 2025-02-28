import React, { useState, useEffect } from "react";
import Header from "../Header";
import MessageBookingDetails from "./MessageBookingDetails";
import ChatMessages from "./MessagesChat";
import { FiChevronsLeft } from "react-icons/fi";
import { sendMessages } from "../../../../helpers/Message"
import { toast } from "sonner";
import { simplifiedResult, filterReservations, getAllconversation, getConversations, getIdsWithLatestIncomingMessages } from "../../../../helpers/Message";
import { useSelector } from "react-redux";
import { setMessages } from "../../../../store/messagesSlice";
import { useDispatch } from "react-redux";
import FilterModal from "../Messages/MessageFilter"
import { setReservations } from "../../../../store/reservationSlice"
import api from "@/api/api";
import { markChatAsRead } from "../../../../store/notificationSlice";
import { useNavigate } from "react-router-dom";
import { setListings } from "../../../../store/listingSlice"
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { setConversations } from "../../../../store/conversationSlice"

const MessageDetails = ({ chatInfo, handleClickMessages }) => {

  const conversation = useSelector((state)=>state.conversation.conversations)
  const reservation = useSelector((state)=>state.reservations.reservations)
  const listings = useSelector((state)=>state.listings.listings)
  const  messsage = useSelector((state)=>state.messages)
  const [openBooking, setOpenBooking] = useState(false);
  const [openSidebarMessage, setOpenSidebarMessage] = useState(false);
  const [messages, setMessage] = useState([]);
  // const [input, setInput] = useState("");
  const [input, setInput] = useState({});
  const [messageLoader, setMessagesLoader] = useState(false)
  const [fromatedConversation, setFormatedConversation] = useState([])
  const [openFilter, setOpenFilter] = useState(null)
  const [filters, setFilters] = useState({quickFilter: "", selectedListing: ""});
  const [filteredConversations, setFilteredConversations] = useState([])
  const unreadChats = useSelector((state) => state.notifications.unreadChats);
  const dispatch = useDispatch()
  const navigate = useNavigate();
  const { messageId }  = useParams()

  const getReservations = async () => {
    try {
        const response = await api.get("/hostaway/get-all/reservations");
        if (response?.data?.detail?.data?.result) {
          const data = response?.data?.detail?.data?.result;
          dispatch(setReservations(data));
          return data;
          }
        } catch (error) {
          console.log("Error at get conversation: ", error);
        }
      };
      const getListings = async () => {
        await getReservations()
        try {
          const response = await api.get("/hostaway/get-all/listings");
          if (response?.data?.detail?.data?.result) {
            const data = response?.data?.detail?.data?.result;
            dispatch(setListings(data));
          }
        } catch (error) {
          console.log("Error at get listings: ", error);
          setLoading(false);
        }
      };
  
      const getConversationData = async () => {
        const data = await getConversations();
        dispatch(setConversations(data));
        const conversationIds = data?.map((conv) => conv.id);
  
        const conversationPromises = conversationIds.map(async (id) => {
          const messages = await getAllconversation(id);
          dispatch(setMessages({ id: id, message: messages }));
          return { id, messages };
        });
        const simplifiedDataArray = await Promise.all(conversationPromises);
        const simplifiedData = simplifiedResult(data, simplifiedDataArray);
        setFormatedConversation(simplifiedData)
      };

      useEffect(() => {
        const newSocket = io(import.meta.env.VITE_SOCKET_HOST, {transports: ["websocket"],});
         newSocket.on("connect", () => {
         console.log("Connected to WebSocket server");
          });
         newSocket.on("received_message", (newMessage) => {
         console.log("New message received: ", newMessage);
         getConversationData()
          });
        setFormatedConversation(simplifiedResult(conversation, messsage))
        if(reservation.length !== 0){
          getListings()
        }
      },[messages])

const getFirstTwoWords = (name)=>{
  const words = name?.split(' ');
  const firstTwoWords = words?.slice(0, 2).join(' ');
  return firstTwoWords
}
  const handleSendMessage = async (chat_id) => {
    const messageBody = input[chat_id]?.trim();
    if (messageBody) {
      setMessagesLoader(true);
      const payload = { body: messageBody, communicationType: "channel" };
      try {
        const data = await sendMessages(chat_id, payload);
        if (data?.length > 0) {
          setMessage([...messages, data[0]]);
          const currentChat = messages.find((item) => item?.id === chat_id);
          const newMessages = [...(currentChat?.messages || []), data[0]];
          dispatch(setMessages({ id: chat_id, message: newMessages }));
        } else {
          toast.error("An error occurred while sending messages. Please try again.");
        }
      } catch (error) {
        console.error("Error sending message:", error);
        toast.error("An unexpected error occurred. Please try again later.");
      } finally {
        setMessagesLoader(false);
        setInput((prev) => ({ ...prev, [chat_id]: "" }));
      }
    }
  };
  const handleCloseMessage = () => {
    navigate("/user/messages")
  }

  const handleApplyFilter = () => {
    const data = filterReservations(reservation, filters);
    const listingMapIds = data?.map(item => item.listingMapId);
    let matchingConversations = conversation.filter(convo => listingMapIds.includes(convo.listingMapId));
    if (filters.quickFilter == "last_message") {
        const latestIncomingIds = getIdsWithLatestIncomingMessages(messsage);
        matchingConversations = matchingConversations.filter(convo => latestIncomingIds.includes(convo.id));
    }
    setFilteredConversations(simplifiedResult(matchingConversations, messsage));
    setOpenFilter(false);
};
  const noMessages = filters?.quickFilter || filters?.selectedListing
    ? !filteredConversations?.length
    : !fromatedConversation?.length;

  return (
    <div className="flex max-h-screen bg-[#fff]">
      <div className={`transition-all duration-300 ${ openSidebarMessage ? "z-50 sm:z-0 fixed sm:sticky top-[70px] sm:top-0 h-full sm:h-auto left-0 bg-white": "hidden md:block"} lg:w-[244px] xl:w-[257px] bg-[#FCFDFC] border-r border-gray-300`}>
        <div className="flex gap-2 pl-6 mt-4">
          <button onClick={handleCloseMessage}>
            <img src="/icons/left.svg" alt="down icon" width={12} height={10} />
          </button>
          <span style={{ "-webkit-text-stroke-width": "0.5px" }} className="text-2xl font-medium"> Messages </span>
        </div>
        {openFilter && <FilterModal setOpenFilter={setOpenFilter} listings={listings} setFilters={setFilters} filters={filters} handleApplyFilter={handleApplyFilter}  setFilteredConversations={setFilteredConversations}/>}
        <div onClick={()=>setOpenFilter(true)} className="flex justify-end mx-2 cursor-pointer">
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
          {(filters.quickFilter !== "" || filters.selectedListing !== ""  ? filteredConversations : fromatedConversation).map((item, index) => (
            <div key={index} onClick={() =>{ handleClickMessages(item?.id, fromatedConversation); dispatch(markChatAsRead({chatId: item.id})) }} className={`flex items-center space-x-2 cursor-pointer mt-[14px] rounded-3xl w-full xl:px-3 px-2 h-12  ${ unreadChats[item.id] ? 'bg-green-100 hover:bg-green-100' : ` hover:bg-gray-50 active:bg-gray-100 ${messageId == item.id ? "bg-gray-100" : "bg-white" }` }`}>
              {item?.recipientPicture ? (
                <img className="w-10 h-10 rounded-full" src={item.recipientPicture} alt="Avatar" />
              ) : (
                <div className="w-[50px] h-[42px] rounded-full bg-green-800 flex items-center justify-center text-xl text-white font-semibold">
                  {item?.recipientName[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex justify-between w-full text-[#292D32] text-nowrap text-base">
                <div>
                  <p>{getFirstTwoWords(item?.recipientName)}</p>
                  <div className={`w-[124px] text-[#292D3270] text-xs overflow-hidden truncate whitespace-nowrap  ${ unreadChats[item.id] && 'font-bold text-gray-700'}`}>
                    {item?.conversationMessages !== "" ? item?.conversationMessages : "Click here to reply"}
                  </div>
                </div>
                <div className="text-xs">{item?.latestMessageTime}</div>
              </div>
            </div>
          ))}
        {noMessages && ( <div className="text-center text-gray-500 mt-10">No messages found</div>)}
        </div>
        <button onClick={() => setOpenSidebarMessage(!openSidebarMessage)} className="bg-gray-100 p-1 py-2 rounded-lg ml-52 sm:hidden block absolute top-1/2">
          <FiChevronsLeft size={24} />
        </button>
      </div>
      {/* Chat Content Area */}
      <div className="flex-1 flex flex-col bg-[#FCFDFC]">
        <div className="border-b border-gray-400">
          <div className="flex pt- bg-white">
            <div className="2xl:w-[84%] xl:w-[52%] lg:w-[36%] w-[32%]">
              {chatInfo?.map((item, index) => (
                <div key={index}  className="py-2 px-1 flex gap-2">
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
            <div className="w-[50%] hidden lg:block">
              <Header title="Chat" messages={messages}/>
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
