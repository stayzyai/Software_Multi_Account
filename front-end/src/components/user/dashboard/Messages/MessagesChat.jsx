import { FiChevronsLeft, FiChevronsRight } from "react-icons/fi";
import { useEffect, useState, useRef } from "react";
import { getAllconversation, formatTimeWithTimezone, formatDateWithTimezone } from "../../../../helpers/Message";
import { ScaleLoader } from 'react-spinners';
import { getAmenity } from "../../../../helpers/Message";
import { useSelector, useDispatch } from "react-redux";
import ButtonLoader from "./ButtonLoader"
import DetectIssue from "./DetectIssue"
import {setTasks} from "../../../../store/taskSlice"
import { getHostawayTask } from "../../../../helpers/TaskHelper"
import useAISuggestion from "../../../../hooks/useAIsuggestion";

const ChatMessages = ({ messages, handleSendMessage, setInput, input, setOpenBooking,
  openBooking, setOpenSidebarMessage, openSidebarMessage, chatInfo, setMessage, messageLoader}) => {

const [isLoading, setLoading] = useState(true)
const messagesEndRef = useRef(null);
const [amenity, setAmenity] = useState([])
const [isAISuggestion, setIsAISuggestion] = useState(false)
const tasks = useSelector((state)=>state.tasks.tasks)
const chat_id = chatInfo?.length > 0 && chatInfo[0]["id"]
const dispatch = useDispatch();
// const isSuggestion = useSelector((state)=>state.notifications.isSuggestion)
const { handleAISuggestion } = useAISuggestion(setInput, chatInfo, amenity, tasks, setIsAISuggestion);

const amenityList = async ()=>{
  const data = await getAmenity()
  setAmenity(data)
}
const fetchedTask = async ()=>{
  const response = await getHostawayTask()
  if (!tasks || tasks.length === 0) {
    dispatch(setTasks(response));
  }
}

useEffect(()=> {
    const getAllMessages = async () => {
      setLoading(true)
      const response = await getAllconversation(chat_id)
      setMessage(response)
      setLoading(false)
    };
    getAllMessages();
  },[chat_id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    amenityList()
    fetchedTask()
  }, []);

  const handleInputChange = (chatId, value) => {
    setInput((prev) => ({ ...prev, [chatId]: value }));
  };

  // Group messages by date for date labels
  const groupMessagesByDate = (messages) => {
    if (!messages || messages.length === 0) return [];
    
    const grouped = [];
    let currentDate = null;
    
    messages.forEach((msg, index) => {
      const messageDate = new Date(msg?.time || msg?.createdAt || new Date().toISOString());
      const dateLabel = formatDateWithTimezone(messageDate.toISOString());
      
      // If this is the first message or the date has changed, add a date label
      if (currentDate !== dateLabel) {
        grouped.push({
          type: 'dateLabel',
          date: dateLabel,
          key: `date-${index}`
        });
        currentDate = dateLabel;
      }
      
      // Add the message
      grouped.push({
        type: 'message',
        ...msg,
        key: `msg-${index}`
      });
    });
    
    return grouped;
  };  

return (
    <div className="w-full flex flex-col mb-6 h-full" onClick={() => setOpenSidebarMessage(!openSidebarMessage)}>
      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
      {!isLoading ? (
          messages?.length > 0 ? (
            groupMessagesByDate(messages).map((item, index) => {
              if (item.type === 'dateLabel') {
                return (
                  <div key={item.key} className="flex justify-center my-4">
                    <div className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-sm">
                      {item.date}
                    </div>
                  </div>
                );
              }
              
              return (
                <div key={item.key} className={`w-full flex ${item.isIncoming === 0 ? "justify-end" : "justify-start"}`}>
                  <div className={`mb-4 p-4 2xl:w-[305px] lg:w-[255px] w-[200px] rounded-[10px] ${item.isIncoming === 0 ? "bg-[#F1F1F1]" : "bg-[#F8F8F8]"}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 bg-green-800 text-white rounded-full flex justify-center items-center ${item.isIncoming !== 0 ? "text-xl font-bold": "text-sm font-semibold"} `}>
                        {item?.isIncoming !== 0 ? chatInfo[0]?.recipientName?.[0] : "You"}
                      </div>
                      <div>
                        <p className="font-semibold text-base">{item.isIncoming !== 0 ? chatInfo[0]?.recipientName : "You"}</p>
                      </div>
                    </div>
                    <p className="p-2 py-4">{item.body}</p>
                    <div className="flex justify-end mt-2">
                      <p className="text-xs text-gray-500">{formatTimeWithTimezone(item?.time || item?.createdAt || new Date().toISOString())}</p>
                    </div>
                  </div>
                </div>
              );
            })
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
         <DetectIssue chatInfo={chatInfo}/>
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
          <div className="border border-gray-400 h-[180px] rounded-xl  px-4">
            <textarea rows={5}
              type="text"
              placeholder="Write your reply here ..."
              className="p-2 w-full focus:outline-none bg-[#FCFDFC] resize-none"
              value={input[chat_id] || ""}
              onChange={(e) => handleInputChange(chat_id, e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage(chat_id)}
            />
            <div className="flex justify-between">
              <button disabled={isAISuggestion} onClick={()=>handleAISuggestion(messages)}>
                {!isAISuggestion? <img src="/icons/stars.svg" />:
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
