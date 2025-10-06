import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import MessageDetails from "../Messages/MessageDetails";
import { useSelector, useDispatch } from "react-redux";
import { setConversations } from "../../../../store/conversationSlice";
import {
  simplifiedResult,
  getConversationsWithResources,
  formattedNewMessage,
  sendMessages,
  getAllconversation,
  formatMessages,
  getSentiment,
  assignSentiment,
} from "../../../../helpers/Message";
import { useNavigate } from "react-router-dom";
import ChatShimmer from "../../../common/shimmer/ChatShimmer";
// import { io } from "socket.io-client"; // COMMENTED OUT - WebSocket disabled
import { setUnreadChat } from "../../../../store/notificationSlice";
import {
  getHostawayUser,
  getHostawayTask,
} from "../../../../helpers/TaskHelper";
import { setHostawayUsers } from "../../../../store/hostawayUserSlice";
import { toast } from "sonner";
import { setTasks } from "../../../../store/taskSlice";
// NEW IMPORTS FOR POLLING
import { useConversationPolling } from "../../../../hooks/useConversationPolling";
import { useSmartPolling } from "../../../../hooks/useSmartPolling";
import StatusIndicator from "../../../common/StatusIndicator";

const MessageDetailsWrapper = () => {
  const { messageId } = useParams();

  const [chatInfo, setChatInfo] = useState([]);
  const [fromatedConversation, setFormatedConversation] = useState([]);
  const [messages, setMessage] = useState([]);
  const [input, setInput] = useState({});
  const [messageLoader, setMessagesLoader] = useState(false);
  const [sentimentLoading, setLoading] = useState(false);
  const [sentimentsummary, setSentimentSummary] = useState({});
  const conversation = useSelector((state) => state.conversation.conversations);
  const users = useSelector((state) => state.hostawayUser.users);
  const tasks = useSelector((state) => state.tasks.tasks);
  const userProfile = useSelector((state) => state.user);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // POLLING HOOKS
  const pollConversations = useConversationPolling();
  const { isActive, pollingInterval, lastUpdate, error, isPolling, triggerUpdate } = useSmartPolling(pollConversations, 30000);

  const handleSendMessage = async (chat_id) => {
    const messageBody = input[chat_id]?.trim();
    if (messageBody) {
      setMessagesLoader(true);
      const payload = { body: messageBody, communicationType: "channel" };
      const data = await sendMessages(chat_id, payload);
      if (data?.length > 0) {
        setMessage([...messages, data[0]]);
        setMessagesLoader(false);
        setInput((prev) => ({ ...prev, [chat_id]: "" }));
        // Trigger conversation list update
        triggerUpdate();
      } else {
        toast.error(
          "An error occurred while sending messages. Please try again."
        );
        setMessagesLoader(false);
        setInput((prev) => ({ ...prev, [chat_id]: "" }));
      }
    }
  };

  const getConversationData = async (newMessage = null) => {
    const data = await getConversationsWithResources();
    dispatch(setConversations(data));
    const simplifiedData = simplifiedResult(data);
    setFormatedConversation(simplifiedData);
    if (newMessage) {
      const chatId = newMessage?.conversationId;
      const currentMessage = formattedNewMessage(newMessage);
      if (messageId == chatId) {
        setMessage((prevMessages) => [...prevMessages, currentMessage]);
      }
      dispatch(setUnreadChat({ chatId: chatId }));
    }
    return simplifiedData;
  };

  const getSentimentSummary = async (messageId) => {
    setLoading(true);
    
    // Check if master AI is disabled
    if (!userProfile.master_ai_enabled) {
      setChatInfo((prevChatInfo) => {
        const updatedChatInfo = prevChatInfo.map((chat) => {
          if (chat.id == messageId) {
            return { ...chat, summary: "AI features disabled", icon: "" };
          }
          return chat;
        });
        return updatedChatInfo;
      });
      setLoading(false);
      return;
    }
    
    if(sentimentsummary?.messageId == messageId){
      const { icon, summary } = sentimentsummary;
      setChatInfo((prevChatInfo) => {
        const updatedChatInfo = prevChatInfo.map((chat) => {
          if (chat.id == messageId) {
            return { ...chat, summary, icon};
          }
          return chat;
        });
        return updatedChatInfo;
      });
      setLoading(false);
      return
    }
    const response = await getAllconversation(messageId);
    const guestMessages = formatMessages(response);
    const sentimentSummary = await getSentiment(guestMessages);
    const cleanedResponse = sentimentSummary?.replace(/```json|```/g, "").trim();
    if(!cleanedResponse){
      setSentimentSummary({summary:"", icon:"", messageId: messageId})
      setChatInfo((prevChatInfo) => {
        const updatedChatInfo = prevChatInfo.map((chat) => {
          if (chat.id == messageId) {
            return { ...chat, summary:"", icon:"" };
          }
          return chat;
        });
        return updatedChatInfo;
      });
      setLoading(false);
      return
    }
    let sentimentData;
    sentimentData = JSON.parse(cleanedResponse);

    if (sentimentData?.sentiment && sentimentData?.summary) {
      const { icon, summary } = assignSentiment(sentimentData);
      setChatInfo((prevChatInfo) => {
        const updatedChatInfo = prevChatInfo.map((chat) => {
          if (chat.id == messageId) {
            return { ...chat, summary, icon };
          }
          return chat;
        });
        return updatedChatInfo;
      });
      setSentimentSummary({summary, icon, messageId: messageId})
    }
    setLoading(false);
  };

  // COMMENTED OUT - WebSocket code disabled, using polling instead
  /*
  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_SOCKET_HOST, {
      transports: ["websocket"],
    });
    newSocket.on("connect", () => {
    });
    newSocket.on("received_message", (newMessage) => {
      getConversationData(newMessage);
    });
    const fetchData = async () => {
      if (fromatedConversation.length == 0 && chatInfo.length == 0) {
        const data = await getConversationData();
        setChatInfo(data?.filter((msg) => msg.id == messageId));
        getSentimentSummary(messageId);
      }
      const userData = users?.length === 0 ? await getHostawayUser() : users;
      if (users?.length === 0) dispatch(setHostawayUsers(userData));
      const tasksData = tasks?.length === 0 ? await getHostawayTask() : tasks;
      dispatch(setTasks(tasksData));
    };
    fetchData();
    return () => {
      newSocket.disconnect();
    };
  }, []);
  */

  // NEW POLLING-BASED DATA FETCHING
  useEffect(() => {
    const fetchData = async () => {
      if (fromatedConversation.length == 0 && chatInfo.length == 0) {
        const data = await getConversationData();
        setChatInfo(data?.filter((msg) => msg.id == messageId));
        getSentimentSummary(messageId);
      }
      const userData = users?.length === 0 ? await getHostawayUser() : users;
      if (users?.length === 0) dispatch(setHostawayUsers(userData));
      const tasksData = tasks?.length === 0 ? await getHostawayTask() : tasks;
      dispatch(setTasks(tasksData));
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchChatInfo = () => {
      const data = simplifiedResult(conversation);
      setChatInfo(data?.filter((msg) => msg.id == messageId));
      getSentimentSummary(messageId);
    };
    if (messageId && conversation?.length !== 0) {
      fetchChatInfo();
    }
  }, [messageId]);

  const handleClickMessages = (chatId, messages) => {
    if (chatId == messageId) return;
    setChatInfo(messages.filter((msg) => msg.id == chatId));
    navigate(`/user/chat/${chatId}`);
  };

  return chatInfo?.length !== 0 && fromatedConversation.length !== 0 ? (
    <MessageDetails
      chatInfo={chatInfo}
      handleClickMessages={handleClickMessages}
      fromatedConversation={fromatedConversation}
      setMessage={setMessage}
      messages={messages}
      setInput={setInput}
      input={input}
      messageLoader={messageLoader}
      handleSendMessage={handleSendMessage}
      sentimentLoading={sentimentLoading}
    />
  ) : (
    <ChatShimmer />
  );
};

export default MessageDetailsWrapper;
