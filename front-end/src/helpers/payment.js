import api from "../api/api";

export const checkout = async (payload) => {
  try {
    const response = await api.get("/payment/create-checkout-session", payload);
    return response.data;
  } catch (error) {
    console.log(error);
  }
};
