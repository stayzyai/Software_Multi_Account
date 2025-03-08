import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import MessageDetails from "../Messages/MessageDetails";
import { useSelector, useDispatch } from "react-redux";
import { setConversations } from "../../../../store/conversationSlice";
import {
  simplifiedResult,
  getConversationsWithResources,
  formattedNewMessage,
} from "../../../../helpers/Message";
import { useNavigate } from "react-router-dom";
import ChatShimmer from "../../../common/shimmer/ChatShimmer";
import { io } from "socket.io-client";
import { setUnreadChat } from "../../../../store/notificationSlice";

const MessageDetailsWrapper = () => {
  const { messageId } = useParams();

  const [chatInfo, setChatInfo] = useState([]);
  const [fromatedConversation, setFormatedConversation] = useState([]);
  const [messages, setMessage] = useState([]);
  const conversation = useSelector((state) => state.conversation.conversations);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const getConversationData = async (newMessage = null) => {
    const data = await getConversationsWithResources();
    dispatch(setConversations(data));
    const simplifiedData = simplifiedResult(data);
    setFormatedConversation(simplifiedData);
    if (newMessage) {
      if (messageId == newMessage?.conversationId) {
        setMessage((prevMessages) => [
          ...prevMessages,
          formattedNewMessage(newMessage),
        ]);
      }
      dispatch(setUnreadChat({ chatId: newMessage?.conversationId }));
    }
    return simplifiedData;
  };

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_SOCKET_HOST, {
      transports: ["websocket"],
    });
    newSocket.on("connect", () => {
      console.log("Connected to WebSocket server");
    });
    newSocket.on("received_message", (newMessage) => {
      console.log("New message received: ", newMessage);
      getConversationData(newMessage);
    });
    const fetchData = async () => {
      if (fromatedConversation.length == 0 && chatInfo.length == 0) {
        const data = await getConversationData();
        setChatInfo(data?.filter((msg) => msg.id == messageId));
      }
    };
    fetchData();
    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    const fetchChatInfo = () => {
      const data = simplifiedResult(conversation);
      setChatInfo(data?.filter((msg) => msg.id == messageId));
    };
    if (messageId && conversation.length !== 0) {
      fetchChatInfo();
    }
  }, [messageId]);

  const handleClickMessages = (chatId, messages) => {
    if (chatId == messageId) return;
    setChatInfo(messages.filter((msg) => msg.id == chatId));
    navigate(`/user/chat/${chatId}`);
  };

  return chatInfo.length !== 0 && fromatedConversation.length !== 0 ? (
    <MessageDetails
      chatInfo={chatInfo}
      setChatInfo={setChatInfo}
      handleClickMessages={handleClickMessages}
      fromatedConversation={fromatedConversation}
      setMessage={setMessage}
      messages={messages}
    />
  ) : (
    <ChatShimmer />
  );
};

export default MessageDetailsWrapper;
