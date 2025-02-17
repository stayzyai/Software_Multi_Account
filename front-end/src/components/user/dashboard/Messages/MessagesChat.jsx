import { FiChevronsLeft, FiChevronsRight } from "react-icons/fi";
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { getAllconversation } from "../../../../helpers/Message";
import { ScaleLoader } from 'react-spinners';
import { openAISuggestion, formatedMessages } from "../../../../helpers/Message";
import { useSelector } from "react-redux";
import { toast } from "sonner";

const ChatMessages = ({ messages, handleSendMessage, setInput, input, setOpenBooking,
  openBooking, setOpenSidebarMessage, openSidebarMessage, chatInfo, setMessage, messageLoader}) => {

const [isLoading, setLoading] = useState(true)
const messagesEndRef = useRef(null);
const [isSuggestion, setSuggestion] = useState(null)
const chat_id = chatInfo?.length > 0 && chatInfo[0]["id"]

const listings = useSelector((state)=>state.listings.listings)

  useEffect(()=> {
    const getAllMessages = async () => {
      setLoading(true)
      const response = await getAllconversation(chat_id)
      setMessage(response)
      setLoading(false)
    };
    getAllMessages();
  },[chatInfo])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_SOCKET_HOST,{transports: ['websocket'],});
    newSocket.on("connect", () => {
      console.log("Connected to WebSocket server");
    });
    newSocket.on("received_message", (newMessage) => {
      console.log("New message received:", newMessage);
      if(chat_id === newMessage?.id){
        setMessage((prevMessages) => [...prevMessages, newMessage]);
      }
    });
    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleAISuggestion = async (messages, chatInfo) => {
    setSuggestion(true)
    const listingMapId = chatInfo[0]["listingMapId"]
    const listing = listings?.find((item)=>item.id === listingMapId)
    const {systemPrompt, lastUserMessage } =  formatedMessages(messages, listing)
    const payload = { prompt: systemPrompt, messsages: lastUserMessage}
    const response = await openAISuggestion(payload)
    setSuggestion(false)
    if(response){
      setInput(response)
      return
    }
    toast.error("Some error occurred. Please try again")
  }

const ButtonLoader = ()=><svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="w-8 h-8 animate-spin" viewBox="0 0 16 16">
  <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z" />
  <path fill-rule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z" />
</svg>

return (
    <div className="w-full flex flex-col mb-6 h-full">
      <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
      {!isLoading ? (
          messages?.length > 0 ? (
            messages.map((msg, index) => (
              <div key={index} className={`w-full flex ${msg.isIncoming === 0 ? "justify-end" : "justify-start"}`}>
                <div className={`mb-4 py-6 px-4 lg:w-1/2 w-3/4 rounded-[10px] ${msg.isIncoming === 0 ? "bg-[#F1F1F1]" : "bg-[#F8F8F8]"}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 bg-green-800 text-white rounded-full flex justify-center items-center ${msg.isIncoming !== 0 ? "text-xl font-bold": "text-sm font-semibold"} `}>
                      {msg.isIncoming !== 0 ? chatInfo[0]?.recipientName[0] : "You"}
                    </div>
                    <div>
                      <p className="font-semibold text-base">{msg.isIncoming !== 0 ? chatInfo[0]?.recipientName : "You"}</p>
                      <p className="text-sm">{msg?.time}</p>
                    </div>
                  </div>
                  <p className="p-2 py-4">{msg.body}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 mt-32">No messages yet</div>
          )
        ) : (
          <div className="flex flex-row gap-3 justify-center items-center mt-80">
            <div className="w-3 h-3 rounded-full bg-green-800 animate-bounce [animation-delay:.7s]"></div>
            <div className="w-3 h-3 rounded-full bg-green-800 animate-bounce [animation-delay:.3s]"></div>
            <div className="w-3 h-3 rounded-full bg-green-800 animate-bounce [animation-delay:.7s]"></div>
          </div>
        )}
         <div ref={messagesEndRef}></div>
      </div>
      <div className="flex justify-between mb-4 xl:hidden">
        <button
          onClick={() => setOpenSidebarMessage(!openSidebarMessage)}
          className="bg-gray-100 p-1 py-2 rounded-lg sm:invisible"
        >
          <FiChevronsRight size={24} />
        </button>
        <button
          onClick={() => setOpenBooking(!openBooking)}
          className="bg-gray-100 p-1 py-2 rounded-lg xl:invisible"
        >
          < FiChevronsLeft size={24} />
        </button>
      </div>
      <div className="flex items-center px-6 w-full">
        <div className="w-full pb-5">
          <div className="flex gap-4 justify-end mb-6">
            <div className="text-sm">Via Lodgify</div>
            <img src="/icons/down.svg" alt="down icon" />
          </div>
          <div className="border border-gray-400 h-[180px] rounded-xl  px-4">
            <textarea rows={5}
              type="text"
              placeholder="Write your reply here ..."
              className="p-2 w-full focus:outline-none bg-[#FCFDFC] resize-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage(chat_id)}
            />
            <div className="flex justify-between">
              <button disabled={isSuggestion} onClick={()=>handleAISuggestion(messages, chatInfo)}>
                {!isSuggestion? <img src="/icons/stars.svg" />:
                <ScaleLoader height={20} loading speedMultiplier={2} width={2}/>}
              </button>
             {!messageLoader ? <button className="rounded-md" onClick={()=>handleSendMessage(chat_id)}>
                <img src="/icons/send.png" />
              </button>:
              <ButtonLoader/>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessages;
