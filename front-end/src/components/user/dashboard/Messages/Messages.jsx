import { useEffect, useState } from "react";
import MessageShimmer from "../../../common/shimmer/MessageShimmer";
import { useDispatch } from "react-redux";
import { setConversations } from "../../../../store/conversationSlice";
import { simplifiedResult, getAllconversation, getConversations} from "../../../../helpers/Message";
import { useSelector } from "react-redux";
import { setMessages } from "../../../../store/messagesSlice";
import { io } from "socket.io-client";
import { updateConversation, updateMessages } from "../../../../helpers/Message"

const Messages = ({ handleClickMessages, title }) => {
  const [simplifiedConversation, setSimplifiedConversation] = useState([]);
  const dispatch = useDispatch();
  const conversation = useSelector((state) => state.conversation.conversations);
  const messages = useSelector((state) => state.messages)

  useEffect(()=>{
    const newSocket = io(import.meta.env.VITE_SOCKET_HOST,{transports: ['websocket']});
    newSocket.on("connect", () => {
      console.log("Connected to WebSocket server");
    });
      newSocket.on("received_message", (newMessage) => {
      console.log("New message received: ", newMessage);
      const updatedMessages  = updateMessages(simplifiedConversation, newMessage)
      setSimplifiedConversation(updatedMessages)
      const updatedData = updateConversation(messages, newMessage)
      dispatch(setMessages({ id: newMessage.conversationId, message: updatedData}));
    });
    newSocket.on("new_reservation", (reservations) => {
      const newReservation = async() =>{
        const data = await getConversations();
        dispatch(setConversations(data));
        const conversation = data?.find((item) =>item.reservationId === reservations.reservation.id);
        const messages =  await getAllconversation(conversation.id);
        dispatch(setMessages({id: conversation.id, message: messages}))
        const simplifiedData = simplifiedResult(data, [{id: conversation.id, message: messages}]);
        setSimplifiedConversation(simplifiedData);
      }
      newReservation()
    });
    return () => {
      newSocket.disconnect();
    };
  },[messages, simplifiedConversation])

  useEffect(() => {
    if (conversation?.length !== 0 && messages?.length !== 0) {
      const simplifiedData = simplifiedResult(conversation, messages);
      setSimplifiedConversation(simplifiedData);
      return;
      }
      const getConversationData = async () => {
      const data = await getConversations()
      dispatch(setConversations(data));
      const conversationIds = data?.map((conv) => conv.id);

      const conversationPromises = conversationIds.map(async (id) => {
      const messages =  await getAllconversation(id);
      dispatch(setMessages({id: id, message: messages}))
        return {id, messages}
      });
      const simplifiedDataArray = await Promise.all(conversationPromises);
      const simplifiedData = simplifiedResult(data, simplifiedDataArray);
      setSimplifiedConversation(simplifiedData);
    };
    getConversationData();
  },[]);

  const getInitials = (name) => {
    let words = name?.trim().split(" ").slice(0, 1);
    return words
      ?.map((word) => word.charAt(0))
      .join("")
      .toUpperCase();
  };

  return (
    <div className="px-2 sm:px-0">
      {simplifiedConversation?.length !== 0 ? (
        <div className="flex flex-col space-y-6 py-4">
          <div className="overflow-hidden bg-white rounded-[14px] shadow-md mx-1 border-[0.2px] border-gray-400">
            <div className="flex justify-between p-5">
              <h2 className="text-lg font-semibold">Latest Messages</h2>
              <div className="flex gap-6 mr-4">
                <div className="flex gap-2 text-[14px] cursor-pointer">
                  <button>Date</button>
                  <img
                    src="/icons/down.svg"
                    alt="down"
                    width={14}
                    height={14}
                  />
                </div>
                <div className="flex gap-2 text-[14px] cursor-pointer">
                  <button>Listing</button>
                  <img
                    src="/icons/down.svg"
                    alt="down"
                    width={14}
                    height={14}
                  />
                </div>
                <div className="flex gap-2 text-[14px] cursor-pointer">
                  <button>Task</button>
                  <img
                    src="/icons/down.svg"
                    alt="down"
                    width={14}
                    height={14}
                  />
                </div>
              </div>
            </div>
            <div className="divide-y mb-6 border-y border-gray-200 mx-4">
              {(title === "Dashboard" ? simplifiedConversation.slice(0, 5): simplifiedConversation)?.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[auto_1fr_auto_auto] items-center px-6 py-3 gap-4"
                >
                  <input
                    type="checkbox"
                    className="w-5 h-5 bg-white rounded-md border-2 border-gray-300 cursor-pointer appearance-none checked:bg-blue-500 checked:border-transparent checked:relative checked:before:content-['✔'] checked:before:absolute checked:before:text-white checked:before:left-1/2 checked:before:top-1/2 checked:before:transform checked:before:-translate-x-1/2 checked:before:-translate-y-1/2 focus:outline-none"
                  />
                  <div className="flex items-center space-x-4">
                    {item?.recipientPicture ? (
                      <img
                        className="w-10 h-10 rounded-full"
                        src={item?.recipientPicture}
                        alt="Avatar"
                      />
                    ) : (
                      <div className="w-[40px] lg:h-[38px] h-[35px] rounded-full bg-green-800 flex items-center justify-center text-xl text-white font-semibold">
                        {getInitials(item?.recipientName)}
                      </div>
                    )}
                    <div
                      onClick={() =>
                        title !== "Dashboard" &&
                        handleClickMessages(item.id, simplifiedConversation)
                      }
                      className="cursor-pointer w-full"
                    >
                      <p className="font-medium text-gray-800">
                        {item?.recipientName}
                      </p>
                      <p className="text-sm text-[#7F7F7F] hidden md:block">
                        {item?.conversationMessages}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className={`title === "Dashboard" ? "mt-6":"mt-12"`}>
          <MessageShimmer />
        </div>
      )}
    </div>
  );
};

export default Messages;
