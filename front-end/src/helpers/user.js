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

export { getProfile };
