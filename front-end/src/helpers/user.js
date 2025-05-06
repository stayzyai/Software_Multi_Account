import api from "@/api/api";

const getProfile = async () => {
  try {
    const response = await api.get("/user/profile");
    if (response?.status === 200 && response?.data) {
      return response.data;
    }
  } catch (error) {
    console.error("Error fetching profile:", error);
  }
};

const reportIssues = async (data) => {
  try {
    const response = await api.post("/admin/report-issue", data);
    if (response?.status === 200 && response?.data) {
      return response.data;
    }
  } catch (error) {
    console.error("Error reporting issues:", error);
    return null;
  }
};

const getAllActiveListing = (listings, conversations, userProfile) => {

  const guestMap = new Map();
  conversations.forEach(convo => {
    guestMap.set(convo.id, convo.recipientName || "Unknown");
  });

  const result = listings.map(listing => {
    const listingId = listing.id;

    const relatedChats = userProfile.chat_list.filter(
      chat => chat.listing_id === listingId
    );

    const listingdetails = relatedChats.map(chat => ({
      chatId: chat.chat_id,
      ai_enabled: chat.ai_enabled,
      guestName: guestMap.get(chat.chat_id) || "Unknown"
    }));

    const listingSubscriptions = relatedChats.some(chat => chat.is_active);

    return {
      id: listing.id,
      name: listing.name,
      listingdetails,
      listingSubscriptions
    };
  });

  return result;
};



export { getProfile, reportIssues, getAllActiveListing };
