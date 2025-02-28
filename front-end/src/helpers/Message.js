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
        date: item.date,
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
    const response = await api.post(
      `/hostaway/post-data/conversations/${chat_id}/messages`,
      payload
    );
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

const getAmenity = async () => {
  try {
    const response = await api.get("/hostaway/get-all/bedTypes")
    if (response?.data?.detail?.data?.result) {
      const responseData = response?.data?.detail?.data?.result;
      return responseData;
    }
  } catch (error) {
    console.log("Error get all amenity", error)
    return []
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

const simplifiedResult = (results, conversation) => {
  return results
    .map((result) => {
      const conv = conversation.find((c) => c.id === result.id);
      let latestConversationMessage = null;
      if (conv && conv.messages.length > 0) {
        latestConversationMessage = conv.messages.reduce((latest, msg) =>
          new Date(msg.date) > new Date(latest.date) ? msg : latest
        );
      }

      return {
        id: result.id,
        recipientName: result.recipientName,
        recipientPicture: result.recipientPicture,
        messageReceivedOn: result.messageReceivedOn,
        messageSentOn: result.messageSentOn,
        reservationId: result.reservationId,
        listingMapId: result.listingMapId,
        latestMessageTime: latestConversationMessage?.time,
        conversationMessages: latestConversationMessage
          ? latestConversationMessage?.body
          : "",
        isIncoming: latestConversationMessage
          ? latestConversationMessage?.isIncoming
          : null,
      };
    })
    .sort((a, b) => {
      const dateA = new Date(a.messageReceivedOn || a.messageSentOn);
      const dateB = new Date(b.messageReceivedOn || b.messageSentOn);
      return dateB - dateA;
    });
};

const formatedMessages = (messages, listing, amenity) => {
  const formattedMessages = messages?.map((msg) => ({
    role: msg.isIncoming == 0 ? "assistant" : "user",
    content: msg.body,
  }));
  const lastUserMessage = formattedMessages
    ?.reverse()
    .find((msg) => msg?.role === "user")?.content;
  const previousConversation = JSON.stringify(formattedMessages);
  const propertyDetails = JSON.stringify(listing);
  const amenityDetails = JSON.stringify(amenity)
  const systemPrompt = SYSTEM_PROMPT.replace(/{previous_conversation}/g, previousConversation)
    .replace(/{latest_message}/g, lastUserMessage)
    .replace(/{property_details}/g, propertyDetails)
    .replace(/{amenities_detail}/g, amenityDetails);
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
  if (!currentReservation) return;
  const formatTime = (hour) => {
    const period = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${formattedHour}:00 ${period}`;
  };
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const [year, month, day] = dateString?.split("-");
    return `${month}/${day}/${year}`;
  };
  const timeDetails = [
    {
      timeIn: {
        date: formatDate(currentReservation?.arrivalDate),
        time: formatTime(currentReservation?.checkInTime),
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
  const conversation = messages.find(
    (item) => item.id === newMessage.conversationId
  );
  if (conversation) {
    const structuredMessage = {
      body: newMessage.body,
      date: newMessage.date,
      imagesUrls: newMessage.imagesUrls,
      isIncoming: newMessage.isIncoming,
    };
    const updatedMessages = [...conversation.messages, structuredMessage];
    return updatedMessages;
  }
  return [];
};

const updateMessages = (simplifiedConversation, newMessage) => {
  const data = simplifiedConversation.map((item) => {
    if (item.id === newMessage.conversationId) {
      return {
        ...item,
        conversationMessages: newMessage.body,
        messageReceivedOn: newMessage.date,
      };
    }
    return item;
  });
  return data;
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

const getAllListings = async () => {
  try {
    const response = await api.get("/hostaway/get-all/listings");
    if (response?.data?.detail?.data?.result) {
      const data = response?.data?.detail?.data?.result;
      return data;
    }
    return [];
  } catch (error) {
    console.log("Error at get  listings", error);
    return [];
  }
};

const filterMessages = (messages, filters) => {
  const { Date: filterType, Listing: selectedListing } = filters;

  if (filterType === "Date" && !selectedListing) {
    return messages;
  }

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const last7Days = new Date(today);
  last7Days.setDate(last7Days.getDate() - 7);

  function isSameDay(date1, date2) {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }
  return messages?.filter((message) => {
    const messageDate = message.messageReceivedOn || message.messageSentOn;
    if (!messageDate) return false;

    const parsedDate = new Date(messageDate);

    let dateMatch = true;
    if (filterType && filterType !== "Date") {
      if (filterType === "Today") {
        dateMatch = isSameDay(parsedDate, today);
      } else if (filterType === "Yesterday") {
        dateMatch = isSameDay(parsedDate, yesterday);
      } else if (filterType === "Last 7 Days") {
        dateMatch = parsedDate >= last7Days;
      }
    }

    let listingMatch = true;
    if (selectedListing && selectedListing !== "") {
      listingMatch = message.listingMapId == selectedListing;
    }

    return dateMatch && listingMatch;
  });
};

const getListingsName = (listings) => {
  return [
    ...listings?.map((item) => ({
      id: item.id,
      name: item.name,
    })),
  ];
};

const getIdsWithLatestIncomingMessages = (data) => {
  const result = data
    .filter((item) => Array.isArray(item.messages) && item.messages.length > 0)
    .map((item) => ({
      id: item.id,
      latestMessage: item.messages.reduce((latest, msg) =>
        new Date(msg.date) > new Date(latest.date) ? msg : latest
      ),
    }))
    .filter((item) => item.latestMessage.isIncoming === 1)
    .map((item) => item.id);

  return result;
};

const filterReservations = (reservations, filters) => {
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const next7Days = new Date();
  next7Days.setDate(next7Days.getDate() + 7);

  return reservations.filter((reservation) => {
    const { quickFilter, selectedListing } = filters;
    const arrivalDate = reservation.arrivalDate;
    const departureDate = reservation.departureDate;

    let matchesQuickFilter = true;
    let matchesListingFilter = true;

    if (quickFilter) {
      switch (quickFilter) {
        case "staying_guests":
          matchesQuickFilter = today >= arrivalDate && today < departureDate;
          break;
        case "today_checkins":
          matchesQuickFilter = arrivalDate === today;
          break;
        case "tomorrow_checkins":
          matchesQuickFilter =
            arrivalDate === tomorrow.toISOString().split("T")[0];
          break;
        case "next_7_days":
          matchesQuickFilter =
            arrivalDate > today &&
            arrivalDate <= next7Days.toISOString().split("T")[0];
          break;
        default:
          matchesQuickFilter = true;
      }
    }
    if (Array.isArray(selectedListing) && selectedListing.length > 0) {
      matchesListingFilter = selectedListing.includes(reservation.listingMapId);
    }

    return matchesQuickFilter && matchesListingFilter;
  });
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
  filterMessages,
  getAllListings,
  getListingsName,
  filterReservations,
  getIdsWithLatestIncomingMessages,
  getAmenity
};
