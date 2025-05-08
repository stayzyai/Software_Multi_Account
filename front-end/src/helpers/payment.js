import api from "../api/api";

export const checkout = async (chatId) => {
  try {
    const response = await api.get(`/payment/create-checkout-session?chatId=${chatId}`);
    return response.data;
  } catch (error) {
    console.log(error);
  }
};

export const updateAIStatus = async (chatId) => {
  try {
    const response = await api.get(`/user/update-ai?chatId=${chatId}`);
    return response.data;
  } catch (error) {
    console.log(error);
  }
};
