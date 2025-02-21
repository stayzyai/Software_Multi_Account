import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import MessageDetails from "../Messages/MessageDetails";
import { useSelector, useDispatch } from "react-redux";
import { setConversations } from "../../../../store/conversationSlice";
import { setMessages } from "../../../../store/messagesSlice";
import {
  simplifiedResult,
  getAllconversation,
  getConversations,
} from "../../../../helpers/Message";
import { useNavigate } from "react-router-dom";
import ChatShimmer from "../../../common/shimmer/ChatShimmer"

const MessageDetailsWrapper = () => {
  const { messageId } = useParams();

  const [chatInfo, setChatInfo] = useState([]);
  const conversation = useSelector((state) => state.conversation.conversations);
  const messsage = useSelector((state) => state.messages);
  const dispatch = useDispatch();
  const navigate = useNavigate()

  useEffect(() => {
    const fetchChatInfo = () => {
      const data = simplifiedResult(conversation, messsage);
      setChatInfo(data?.filter((msg) => msg.id == messageId));
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
      setChatInfo(simplifiedData?.filter((msg) => msg.id == messageId));
    };

    if (messageId && conversation.length !== 0) {
      fetchChatInfo();
      return;
    }
    getConversationData();
  }, [messageId]);

  const handleClickMessages = (chatId, messages) => {
    if( chatId == messageId ) return
    setChatInfo(messages.filter((msg) => msg.id == chatId));
    navigate(`/user/chat/${chatId}`);
  };  

  return chatInfo.length !== 0 ? (
    <MessageDetails
      chatInfo={chatInfo}
      setChatInfo={setChatInfo}
      handleClickMessages={handleClickMessages}
    />
  ) : (
    <ChatShimmer/>
  );
};

export default MessageDetailsWrapper;
