import React, { useState, useEffect } from "react";
import { FiChevronsLeft } from "react-icons/fi";
import { toast } from "sonner";
import { simplifiedResult, filterReservations, getAllconversation, getConversations, getIdsWithLatestIncomingMessages, getHostawayReservation, getAllListings, sendMessages } from "../../../../helpers/Message";
import { useSelector, useDispatch } from "react-redux";
import { setMessages } from "../../../../store/messagesSlice";
import FilterModal from "../Messages/MessageFilter"
import { setReservations } from "../../../../store/reservationSlice"
import { useNavigate } from "react-router-dom";
import { setListings } from "../../../../store/listingSlice"
import { io } from "socket.io-client";
import { setConversations } from "../../../../store/conversationSlice"
import MessageChatDetails from "./MessageChatDetails"
import ChatSidebar from "./MessageSidebar";

const MessageDetails = ({ chatInfo, handleClickMessages }) => {

    const conversation = useSelector((state)=>state.conversation.conversations)
    const reservation = useSelector((state)=>state.reservations.reservations)
    const listings = useSelector((state)=>state.listings.listings)
    const  messsage = useSelector((state)=>state.messages)
    const [openBooking, setOpenBooking] = useState(false);
    const [openSidebarMessage, setOpenSidebarMessage] = useState(false);
    const [messages, setMessage] = useState([]);
    const [input, setInput] = useState("");
    const [messageLoader, setMessagesLoader] = useState(false)
    const [fromatedConversation, setFormatedConversation] = useState([])
    const [openFilter, setOpenFilter] = useState(null)
    const [filters, setFilters] = useState({quickFilter: "", selectedListing: ""});
    const [filteredConversations, setFilteredConversations] = useState([])
    const dispatch = useDispatch()
    const navigate = useNavigate();

    const getReservations = async () => {
        const data  = await getHostawayReservation()
        dispatch(setReservations(data));
    };

    const getListings = async () => {
        await getReservations()
        const data = await getAllListings()
        dispatch(setListings(data));
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
            setMessagesLoader(false)
          }else{
            toast.error("An error occurred while sending messages. Please try again")
          }
        }
      };

  const handleApplyFilter = () => {
    const data = filterReservations(reservation, filters);
    const listingMapIds = data.map(item => item.listingMapId);
    let matchingConversations = conversation.filter(convo => listingMapIds.includes(convo.listingMapId));
    if (filters.quickFilter == "last_message") {
        const latestIncomingIds = getIdsWithLatestIncomingMessages(messsage);
        matchingConversations = matchingConversations.filter(convo => latestIncomingIds.includes(convo.id));
    }
    setFilteredConversations(simplifiedResult(matchingConversations, messsage));
    setOpenFilter(false);
};

  return (
    <div className="flex max-h-screen bg-[#fff]">
      <div className={`transition-all duration-300 ${ openSidebarMessage ? "z-50 sm:z-0 fixed sm:sticky top-[70px] sm:top-0 h-full sm:h-auto left-0 bg-white": "hidden md:block"} lg:w-[244px] xl:w-[257px] bg-[#FCFDFC] border-r border-gray-300`}>
        <div className="flex gap-2 pl-6 mt-4">
          <button onClick={()=>navigate("/user/messages")}>
            <img src="/icons/left.svg" alt="down icon" width={12} height={10} />
          </button>
          <span style={{ "-webkit-text-stroke-width": "0.5px" }} className="text-2xl font-medium"> Messages </span>
        </div>
          {openFilter && (
            <FilterModal
              setOpenFilter={setOpenFilter}
              listings={listings}
              setFilters={setFilters}
              filters={filters}
              handleApplyFilter={handleApplyFilter}
              setFilteredConversations={setFilteredConversations}
            />
          )}
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
          <ChatSidebar
            filters={filters}
            filteredConversations={filteredConversations}
            fromatedConversation={fromatedConversation}
            handleClickMessages={handleClickMessages}
          />
          <button
            onClick={() => setOpenSidebarMessage(!openSidebarMessage)}
            className="bg-gray-100 p-1 py-2 rounded-lg ml-52 sm:hidden block absolute top-1/2"
          >
            <FiChevronsLeft size={24} />
          </button>
        </div>
        <MessageChatDetails
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
    </div>
  );
};

export default MessageDetails;
