// front-end/src/api/api.js

import axios from "axios";
import { getItem } from "../helpers/localstorage";
import { jwtDecode } from "jwt-decode";

//const baseURL = import.meta.env.VITE_API_HOST;
const baseURL = import.meta.env.VITE_API_HOST || "http://3.82.36.110:8000/api";



const axiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

const isTokenExpired = (token) => {
  try {
    const decodedToken = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decodedToken.exp < currentTime + 30;
  } catch {
    return true;
  }
};

// Add this variable to track ongoing refresh requests
let refreshTokenPromise = null;

const refreshToken = async () => {
  if (refreshTokenPromise) {
    return refreshTokenPromise;
  }

  const refreshToken = getItem("refreshToken");
  if (!refreshToken) throw new Error("No refresh token available");

  refreshTokenPromise = axios.get(`${baseURL}/user/refresh-token`, {
    headers: {
      Authorization: `Bearer ${refreshToken}`,
    },
  })
    .then(response => response.data.detail)
    .catch(error => {
      if (error.response?.status === 401) {
        window.dispatchEvent(new CustomEvent('sessionExpired'));
      }
      throw error;
    })
    .finally(() => {
      refreshTokenPromise = null;
    });

  return refreshTokenPromise;
};

axiosInstance.interceptors.request.use(
  async (config) => {
    let token = getItem("token");

    if (!token) {
      return config;
    }

    if (isTokenExpired(token)) {
      try {
        const { access_token, refresh_token } = await refreshToken();

        localStorage.setItem("token", access_token);
        localStorage.setItem("refreshToken", refresh_token);

        token = access_token;
      } catch (error) {
        console.log(error);
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userRole");
        // window.location.href = "/user/login";
        return Promise.reject(error);
      }
    }

    config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userRole");
      // window.location.href = "/user/login";
    }
    return Promise.reject(error);
  }
);

export const api = {
  get: (url) => axiosInstance.get(url),
  post: (url, data) => axiosInstance.post(url, data),
  put: (url, data) => axiosInstance.put(url, data),
  delete: (url, data) => axiosInstance.delete(url, data),
};

// AI Catchup API function
export const triggerAICatchup = async (chatId) => {
  try {
    const response = await axiosInstance.post(`/user/ai-catchup/${chatId}`);
    return response.data;
  } catch (error) {
    console.error("Error triggering AI catchup:", error);
    throw error;
  }
};

export default api;
