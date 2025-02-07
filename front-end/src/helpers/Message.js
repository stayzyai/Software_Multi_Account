import api from "@/api/api";
import { SYSTEM_PROMPT } from "./prompt";

const filteredResult = (result) =>
  result
    .map((item) => {
      const dateObj = new Date(item.date.replace(" ", "T"));
      let hours = dateObj.getHours();
      const minutes = dateObj.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours === 0 ? 12 : hours;
      const minutesStr = minutes < 10 ? "0" + minutes : minutes;
      const time = `${hours}:${minutesStr} ${ampm}`;
      return {
        body: item.body.replace(/<\/?[^>]+>/g, ""),
        time,
        imagesUrls: item.imagesUrls,
        isIncoming: item.isIncoming,
      };
    })
    .reverse();

const getAllconversation = async (chat_id) => {
  try {
    const response = await api.get(
      `/hostaway/get-all/conversations/${chat_id}/messages`
    );
    if (response?.data?.detail?.data?.result) {
      const simplifiedData = response?.data?.detail?.data?.result;
      return filteredResult(simplifiedData);
    }
  } catch (Error) {
    console.log("Error at get all messages: ", Error);
  }
};

const sendMessages = async (chat_id, payload) => {
  try {
    const response = await api.post(`/hostaway/post-data/conversations/${chat_id}/messages`, payload);
    if (response?.data?.detail?.data?.result) {
      const data = [];
      const responseData = response?.data?.detail?.data?.result;
      data.push(responseData);
      const simplifiedResponse = filteredResult(data);
      return simplifiedResponse;
    }
    return [];
  } catch (Error) {
    console.log("Error at get all messages: ", Error);
    return [];
  }
};

const formatTime = (dateStr) => {
  if (!dateStr) return null;
  const dateObj = new Date(dateStr.replace(" ", "T"));
  let hours = dateObj.getHours();
  const minutes = dateObj.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours === 0 ? 12 : hours;
  const minutesStr = minutes < 10 ? "0" + minutes : minutes;
  return `${hours}:${minutesStr} ${ampm}`;
};

const simplifiedResult = (result, conversation) => {
  return result?.map(
    ({ id, recipientName, recipientPicture, messageReceivedOn, reservationId,
      listingMapId }) => {
      const foundConversation = conversation?.find((item) => item.id === id);
      const latestMessage = foundConversation?.messages[foundConversation?.messages?.length-1]
      return { id, recipientName, recipientPicture, messageReceivedOn: latestMessage?.time, reservationId,
        listingMapId, conversationMessages: latestMessage?.body ?? "", };
    }
  )
};

const formatedMessages = (messages, listing) => {
  const formattedMessages = messages?.map((msg) => ({
    role: msg.isIncoming == 0 ? "assistant" : "user",
    content: msg.body,
  }));
  const lastUserMessage = formattedMessages
    ?.reverse()
    .find((msg) => msg.role === "user")["content"];
  const previousConversation = JSON.stringify(formattedMessages);
  const propertyDetails = JSON.stringify(listing);
  const systemPrompt = SYSTEM_PROMPT.replace(
    "{previous_conversation}",
    previousConversation
  )
    .replace("{latest_message}", lastUserMessage)
    .replace("{property_details}", propertyDetails);

  return { systemPrompt, lastUserMessage };
};

const openAISuggestion = async (payload) => {
  try {
    const response = await api.post(`/user/ai-suggestion`, payload);
    if (response?.data?.answer) {
      return response?.data?.answer;
    }
    return null;
  } catch (Error) {
    console.log("Error at get all messages: ", Error);
    return null;
  }
};

const getTimeDetails = (currentReservation) => {
  const formatTime = (hour) => {
    const period = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${formattedHour}:00 ${period}`;
  };
  const formatDate = (dateString) => {
    const [year, month, day] = dateString?.split("-");
    return `${month}/${day}/${year}`;
  };
  const timeDetails = [
    {
      timeIn: {
        date: formatDate(currentReservation?.arrivalDate),
        time: formatTime(currentReservation.checkInTime),
      },
      timeOut: {
        date: formatDate(currentReservation?.departureDate),
        time: formatTime(currentReservation?.checkOutTime),
      },
    },
  ];
  return timeDetails;
};

const getBookingdetails = (currentReservation) => {
  const { departureDate, channelName, numberOfGuests, nights, totalPrice } =
    currentReservation;
  const reservationStatus =
    new Date(departureDate) < new Date() ? "Not checked in" : "Checked in";
  const channel = channelName === "direct" ? "Hostaway" : channelName;
  const bookingDetails = [
    { label: "Resrevation", value: reservationStatus },
    { label: "Channel", value: channel },
    { label: "Guests", value: numberOfGuests.toString() },
    { label: "Nights", value: nights.toString() },
    { label: "Price", value: totalPrice.toString() },
    { label: "AI", value: "Not enabled" },
  ];

  return bookingDetails;
};

const updateConversation = (messages, newMessage) => {
  const conversation = messages.find((item) => item.id === newMessage.conversationId);
  if (conversation) {
    const structuredMessage = {
      "body": newMessage.body,
      "date": newMessage.date,
      "imagesUrls": newMessage.imagesUrls,
      "isIncoming": newMessage.isIncoming
    };
    const updatedMessages = [...conversation.messages, structuredMessage];
    return updatedMessages;
  }
  return [];
};

const updateMessages = (simplifiedConversation, newMessage) => {
  const data =  simplifiedConversation.map((item) => {
    if (item.id === newMessage.conversationId) {
      return {
        ...item,
        conversationMessages: newMessage.body,
        messageReceivedOn: newMessage.date
      };
    }
    return item;
  });
  return data
};

const getConversations = async () => {
  try {
    const response = await api.get("/hostaway/get-all/conversations");
    if (response?.data?.detail?.data?.result) {
      const data = response?.data?.detail?.data?.result;
      return data;
    }
    return [];
  } catch (error) {
    console.log("Error at get conversations: ", error);
    return [];
  }
};

export {
  getAllconversation,
  sendMessages,
  simplifiedResult,
  openAISuggestion,
  getTimeDetails,
  getBookingdetails,
  formatedMessages,
  updateConversation,
  updateMessages,
  getConversations,
};
