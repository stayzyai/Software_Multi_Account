import api from "@/api/api";
import { SYSTEM_PROMPT } from "./prompt";
import { TASK_GENERATION_PROMPT } from "./taskPrompt";

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

const formatMessages = (messages) => {
  const formattedMessages = messages?.map((msg) => ({
    role: msg.isIncoming == 0 ? "assistant" : "guest",
    content: msg.body,
  }));
  return formattedMessages;
};

const getSentiment = async (chatData) => {
  try {
    const payload = { chatData: chatData };
    const response = await api.post(`/sentiment/get-sentiment`, payload);
    if (response?.status == 200) {
      return response?.data;
    }
    return null;
  } catch (Error) {
    console.log("Error at get sentiment: ", Error);
  }
};

const assignSentiment = (sentimentData) => {
  const icons = {
    Angry: "/icons/Angry_Face.svg",
    Frowning: "/icons/Frowning_Face.svg",
    Grinning: "/icons/Grinning_Face.svg",
    Neutral: "/icons/Neutral_Face.svg",
    "Slightly Smiling": "/icons/Slightly_Smiling_Face.svg",
  };

  const icon = icons[sentimentData["sentiment"]] || null;
  const summary = sentimentData["summary"] || null;
  if (!icon || !summary) {
    return { icon: null, summary: null };
  }

  return { icon: icon, summary: summary }; // Return icon and summary as an object
};

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
    console.log("Error at send messages: ", Error);
    return [];
  }
};

const getHostawayReservation = async () => {
  try {
    const response = await api.get("/hostaway/get-all/reservations");
    if (response?.data?.detail?.data?.result) {
      const data = response?.data?.detail?.data?.result;
      return data;
    }
  } catch (error) {
    console.log("Error at get conversation: ", error);
    return [];
  }
};

const getConversations = async (limit = null) => {
  try {
    const url = limit
      ? `/hostaway/get-all/conversations?limit=${limit}`
      : "/hostaway/get-all/conversations";
    const response = await api.get(url);
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

const getConversationsWithResources = async () => {
  try {
    const url = `/hostaway/get-all/conversations?includeResources=1`;
    const response = await api.get(url);
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

const getAllListings = async (limit = null) => {
  try {
    const url = limit
      ? `/hostaway/get-all/listings?limit=${limit}`
      : "/hostaway/get-all/listings";
    const response = await api.get(url);
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

const getAmenity = async () => {
  try {
    const response = await api.get("/hostaway/get-all/bedTypes");
    if (response?.data?.detail?.data?.result) {
      const responseData = response?.data?.detail?.data?.result;
      return responseData;
    }
  } catch (error) {
    console.log("Error get all amenity", error);
    return [];
  }
};
const formatedTime = (date) => {
  return date?.split(" ")[1];
};

const simplifiedResult = (conversations) => {
  return conversations
    .map((result) => {
      return {
        id: result.id,
        recipientName: result.recipientName,
        recipientPicture: result.recipientPicture,
        messageReceivedOn: result.messageReceivedOn,
        messageSentOn: result.messageSentOn,
        reservationId: result.reservationId,
        listingMapId: result.listingMapId,
        latestMessageTime: result?.conversationMessages?.length
          ? result?.conversationMessages[0].date
          : "",
        conversationMessages: result?.conversationMessages?.length
          ? result?.conversationMessages[0].body
          : "",
        isIncoming: result?.conversationMessages?.length
          ? result?.conversationMessages[0].isIncoming
          : "",
      };
    })
    .sort((a, b) => {
      const dateA = new Date(a.messageReceivedOn || a.messageSentOn);
      const dateB = new Date(b.messageReceivedOn || b.messageSentOn);
      return dateB - dateA;
    });
};

const formatedMessages = (
  messages,
  listing,
  amenity,
  reservationGaps,
  startReservationDate,
  stayingGuest,
  reservations = [],
) => {
  const formattedMessages = messages?.map((msg) => ({
    role: msg.isIncoming == 0 ? "assistant" : "user",
    content: msg.body,
  }));
  const lastUserMessage = formattedMessages
    ?.reverse()
    .find((msg) => msg?.role === "user")?.content;
  const previousConversation = JSON.stringify(formattedMessages);
  const propertyDetails = JSON.stringify(listing);
  const amenityDetails = JSON.stringify(amenity);
  const reservationDetails = JSON.stringify(reservations);

  let systemPrompt = SYSTEM_PROMPT.replace(
    /{previous_conversation}/g,
    previousConversation
  )
    .replace(/{latest_message}/g, lastUserMessage)
    .replace(/{property_details}/g, propertyDetails)
    .replace(/{amenities_detail}/g, amenityDetails)
    .replace(/{starting_reservation}/g, startReservationDate)
    .replace(/{gap_details}/g, reservationGaps)
    .replace(/{current_booking}/g, stayingGuest);

  // Add reservation details if available
  if (reservations && reservations.length > 0) {
    systemPrompt = systemPrompt.replace(
      /{reservation_details}/g,
      reservationDetails
    );
  } else {
    systemPrompt = systemPrompt.replace(
      /{reservation_details}/g,
      "No reservation data available."
    );
  }

  return { systemPrompt, lastUserMessage };
};

const sendEmail = async (payload) => {
  try {
    const response = await api.post(`/hostaway/send-email`, payload);
    if (response?.status === 200) {
      return response;
    }
    return null;
  } catch (Error) {
    console.log("Error at send message: ", Error);
    return null;
  }
};

const formatDateTime = (date) => {
  return date.toISOString().replace("T", " ").split(".")[0];
};

// Timezone Helper Functions
// Timezone change event for triggering re-renders
let timezoneChangeListeners = [];

export const addTimezoneChangeListener = (callback) => {
  timezoneChangeListeners.push(callback);
};

export const removeTimezoneChangeListener = (callback) => {
  timezoneChangeListeners = timezoneChangeListeners.filter(listener => listener !== callback);
};

export const notifyTimezoneChange = () => {
  timezoneChangeListeners.forEach(listener => listener());
};

const getUserTimezone = () => {
  try {
    // Try to get timezone from Redux store (if available)
    const storedState = localStorage.getItem('persist:user');
    if (storedState) {
      const parsedState = JSON.parse(storedState);
      if (parsedState.timezone) {
        // The timezone might be stored as a string or JSON string
        let timezone;
        try {
          timezone = JSON.parse(parsedState.timezone);
        } catch {
          // If it's not JSON, use it directly
          timezone = parsedState.timezone;
        }
        
        if (timezone && typeof timezone === 'string') {
          console.log('Using stored timezone:', timezone);
          return timezone;
        }
      }
    }
    
    console.log('No stored timezone found, using Central Time as default');
    // Don't fall back to browser timezone - use Central Time as default
    return "America/Chicago";
  } catch (error) {
    console.log("Could not detect timezone:", error);
    return "America/Chicago";
  }
};

const getTimezoneAbbreviation = (timezone) => {
  const timezoneAbbreviations = {
    "America/New_York": "EST",
    "America/Chicago": "CT", 
    "America/Denver": "MST",
    "America/Los_Angeles": "PST",
    "America/Phoenix": "MST",
    "Europe/London": "GMT",
    "Europe/Paris": "CET",
    "Asia/Kolkata": "IST",
    "Asia/Tokyo": "JST",
    "Asia/Shanghai": "CST",
    "Australia/Sydney": "AEST",
    "Pacific/Auckland": "NZST"
  };
  
  return timezoneAbbreviations[timezone] || "CT";
};

const formatTimeWithTimezone = (dateString, timezone = null) => {
  try {
    // Validate input
    if (!dateString) {
      return "Invalid Time";
    }
    
    const timezoneToUse = timezone || getUserTimezone();
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid Time";
    }
    
    // Format time in 12-hour format with timezone
    const timeOptions = {
      timeZone: timezoneToUse,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    
    const timeStr = date.toLocaleTimeString('en-US', timeOptions);
    const timezoneAbbr = getTimezoneAbbreviation(timezoneToUse);
    
    return `${timeStr} ${timezoneAbbr}`;
  } catch (error) {
    console.log("Error formatting time with timezone:", error);
    return "Invalid Time";
  }
};

const formatDateWithTimezone = (dateString, timezone = null) => {
  try {
    // Validate input
    if (!dateString) {
      return "Invalid Date";
    }
    
    const timezoneToUse = timezone || getUserTimezone();
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }
    
    const now = new Date();
    
    // Check if it's today
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (messageDate.getTime() === today.getTime()) {
      return "Today";
    }
    
    // Check if it's yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.getTime() === yesterday.getTime()) {
      return "Yesterday";
    }
    
    // Check if it's this week (within 7 days)
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    if (messageDate > weekAgo) {
      // Show day name
      return date.toLocaleDateString('en-US', { 
        timeZone: timezoneToUse,
        weekday: 'long' 
      });
    }
    
    // For older dates, show month and day
    return date.toLocaleDateString('en-US', { 
      timeZone: timezoneToUse,
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.log("Error formatting date with timezone:", error);
    return "Invalid Date";
  }
};

const formatSidebarTime = (dateString, timezone = null) => {
  try {
    // Validate input
    if (!dateString) {
      return "Invalid Date";
    }
    
    const timezoneToUse = timezone || getUserTimezone();
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }
    
    const now = new Date();
    
    // Check if it's today
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (messageDate.getTime() === today.getTime()) {
      // Show time for today
      return formatTimeWithTimezone(dateString, timezoneToUse);
    }
    
    // Show date for other days
    return formatDateWithTimezone(dateString, timezoneToUse);
  } catch (error) {
    console.log("Error formatting sidebar time:", error);
    return "Invalid Date";
  }
};

const ticketCreateByAI = async (
  message,
  listingMapId,
  reservationId,
  users,
  tasks
) => {
  try {
    const usersDetails = JSON.stringify(users);
    const payload = {
      prompt: TASK_GENERATION_PROMPT.replace(/{{message}}/g, message)
        .replace(/{{users}}/g, usersDetails)
        .replace(/{{reservationId}}/g, reservationId)
        .replace(/{{tasks}}/g, tasks),
    };
    const response = await api.post(`/hostaway/ai-issue-detection`, payload);
    if (response?.data?.answer) {
      const rawAnswer = response?.data?.answer;
      const cleanText = rawAnswer.replace(/^```json\s*|\s*```$/g, "");
      const parsedResponse = JSON.parse(cleanText);
      const { email, ...taskDetails } = parsedResponse;
      const payloadResponse = {
        ...taskDetails,
        listingMapId: listingMapId,
        reservationId: reservationId,
        canStartFrom: formatDateTime(new Date()),
      };
      return { payloadResponse, email };
    }
    return null;
  } catch (Error) {
    console.log("Error at create ticket by AI: ", Error);
    return null;
  }
};

const createTicket = async (payload) => {
  try {
    const response = await api.post(`/hostaway/create/tasks`, payload);
    if (response?.status === 200) {
      return response?.data?.detail?.data?.result;
    }
    return null;
  } catch (Error) {
    console.log("Error at create ticket: ", Error);
    return null;
  }
};

const deleteTask = async (id) => {
  try {
    const response = await api.delete(`/hostaway/delete/tasks/${id}`);
    if (response?.status === 200) {
      return response?.data?.detail?.data?.result;
    }
    return null;
  } catch (Error) {
    console.log("Error at delete task: ", Error);
    return null;
  }
};

const updateTask = async (payload, id) => {
  try {
    const response = await api.post(`/hostaway/update/tasks/${id}`, payload);
    if (response?.status === 200) {
      return response?.data?.detail?.data?.result;
    }
    return null;
  } catch (Error) {
    console.log("Error at create ticket: ", Error);
    return null;
  }
};

const openAISuggestion = async (
  payload,
  listingMapId,
  reservationId,
  users,
  setIssueStatus,
  tasks,
  dispatch
) => {
  try {
    const response = await api.post(`/user/ai-suggestion`, payload);
    if (response?.data?.answer) {
      const answer = response?.data?.answer.trim();
      let parsedResponse;
      if (answer.startsWith("{") && answer.endsWith("}")) {
        parsedResponse = JSON.parse(response?.data?.answer);
        if (parsedResponse?.response && parsedResponse?.issues) {
          if (parsedResponse?.issues !== "Yes, issue detected") {
            return { response: parsedResponse.response, taskId: null };
          }
          dispatch(setIssueStatus("issue detected"));
          const { payloadResponse, email } = await ticketCreateByAI(
            payload?.messsages,
            listingMapId,
            reservationId,
            users,
            tasks
          );
          const task = await createTicket(payloadResponse);
          if (task) {
            dispatch(setIssueStatus("task created"));
            await sendEmail(email);
          }
          return { response: parsedResponse.response, taskId: task?.id };
        } else {
          return { response: parsedResponse.response, taskId: null };
        }
      }
      return { response: response?.data?.answer, taskId: null };
    }
    return { response: response?.data?.answer, taskId: null };
  } catch (Error) {
    console.log("Error at get AI suggestion: ", Error);
    return { response: null, taskId: null };
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
    try {
      const userTimezone = getUserTimezone();
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        timeZone: userTimezone,
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      // Fallback to original format if there's an error
      const [year, month, day] = dateString
        ? dateString.split("-")
        : ["", "", ""];
      return `${month}/${day}/${year}`;
    }
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
  
  // Use timezone-aware date comparison
  const userTimezone = getUserTimezone();
  const now = new Date();
  const departure = new Date(departureDate);
  
  // Convert both dates to the user's timezone for comparison
  const nowInUserTz = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
  const departureInUserTz = new Date(departure.toLocaleString('en-US', { timeZone: userTimezone }));
  
  const reservationStatus = departureInUserTz < nowInUserTz ? "Not checked in" : "Checked in";
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

const filterMessages = (messages, filters, selectedIds, selectedListingIds) => {
  const {
    Date: filterType,
    Listing: selectedListing,
    Task: selectedTask,
  } = filters;
  if (
    filterType === "Date" &&
    !selectedListing &&
    !selectedTask &&
    selectedIds?.length == 0 &&
    selectedListingIds?.length == 0
  ) {
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
    if (selectedListingIds?.length !== 0) {
      // listingMatch = message.listingMapId == selectedListing;
      listingMatch = selectedListingIds.includes(message.listingMapId);
    }

    // Task filter (by reservationId)
    let taskMatch = true;
    if (selectedIds?.length > 0) {
      taskMatch = selectedIds.includes(message.reservationId);
    }
    return dateMatch && listingMatch && taskMatch;
  });
};

const getListingsName = (listings) => {
  return [
    ...(listings || []).map((item) => ({
      id: item.id,
      name: item.name,
    })),
  ];
};

const getTasksTitle = (tasks) => {
  return [
    ...(tasks || []).map((item) => ({
      id: item.reservationId,
      name: item.title,
    })),
  ];
};

const getIdsWithLatestIncomingMessages = (data) => {
  return data
    .filter((convo) =>
      convo.conversationMessages.some((message) => message.isIncoming === 1)
    )
    .map((convo) => convo.id);
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

const formattedNewMessage = (data) => {
  return {
    body: data.body,
    time: formatedTime(data.date),
    imagesUrls: data.imagesUrls,
    isIncoming: data.isIncoming,
    date: data.date,
  };
};

const getReservationsGap = (reservations, listingMapId, listings) => {
  if (!reservations || reservations.length === 0)
    return { dateRanges: [], reservationStartDate: [] };

  const filteredReservations = reservations?.filter(
    (res) => res?.listingMapId == listingMapId
  );

  const sortedReservations = [...filteredReservations].sort(
    (a, b) => new Date(a.arrivalDate) - new Date(b.arrivalDate)
  );
  const listing = listings.find((item) => item.id == listingMapId);
  const reservationStartDate = listing?.insertedOn;
  const bookings = [];
  const dateRanges = [];

  for (let i = 0; i < sortedReservations.length; i++) {
    const res = sortedReservations[i];
    const nextRes = sortedReservations[i + 1];

    const startDate = res?.arrivalDate;
    const endDate = res?.departureDate;

    bookings.push({
      id: res?.reservationId?.toString(),
      guestName: res?.guestName,
      startDate,
      endDate,
      nights: res?.nights,
      guests: res?.numberOfGuests,
    });
    dateRanges.push(`${startDate} - ${endDate}`);

    if (
      nextRes &&
      new Date(res?.departureDate) < new Date(nextRes?.arrivalDate)
    ) {
      const gapStart = endDate;
      const gapEnd = nextRes?.arrivalDate;
      dateRanges.push(`${gapStart} - ${gapEnd}`);
    }
  }
  return { dateRanges, reservationStartDate };
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
  getConversations,
  filterMessages,
  getAllListings,
  getListingsName,
  filterReservations,
  getIdsWithLatestIncomingMessages,
  getHostawayReservation,
  getAmenity,
  getTasksTitle,
  getConversationsWithResources,
  formattedNewMessage,
  createTicket,
  updateTask,
  deleteTask,
  formatMessages,
  getSentiment,
  assignSentiment,
  getReservationsGap,
  // Timezone functions
  getUserTimezone,
  formatTimeWithTimezone,
  formatDateWithTimezone,
  formatSidebarTime,
};