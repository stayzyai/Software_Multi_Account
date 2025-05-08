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

const getAllActiveListing = (conversations, userProfile) => {
  const guestMap = new Map();
  conversations.forEach((convo) => {
    guestMap.set(convo.id, convo.recipientName || "Unknown");
  });

  const result = userProfile?.chat_list?.map((chat) => ({
    chatId: chat.chat_id,
    ai_enabled: chat.ai_enabled,
    guestName: guestMap.get(chat.chat_id) || "Unknown",
  }));

  return result;
};

const getPaymentData = async () => {
  try {
    const response = await api.get("/payment/card-details");
    if (response.status == 200) {
      const data = response?.data?.card_details;
      return data;
    }
  } catch (error) {
    console.error("Error at get payment ", error);
  }
};

export { getProfile, reportIssues, getAllActiveListing, getPaymentData };
