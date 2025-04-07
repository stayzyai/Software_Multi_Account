import api from "../api/api";

export const checkout = async (chatId, listingId) => {
  try {
    const response = await api.get(`/payment/create-checkout-session?chatId=${chatId}&listingId=${listingId}`);
    return response.data;
  } catch (error) {
    console.log(error);
  }
};

export const updateAIStatus = async (chatId, listingId) => {
  try {
    const response = await api.get(`/user/update-ai?chatId=${chatId}&listingId=${listingId}`);
    return response.data;
  } catch (error) {
    console.log(error);
  }
};
