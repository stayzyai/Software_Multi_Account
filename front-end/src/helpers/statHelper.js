import api from "@/api/api";

export const fetchResponseQuality = async () => {
    try {
      const response = await api.get(`/stats/response-quality`);
      return {
        average_score: response.data.average_score,
        is_increase: response.data.is_increase,
        percentage_change: response.data.percentage_change,
      };
    } catch (error) {
      console.error("Failed to fetch response quality:", error);
      throw error;
    }
  };
  
  export const fetchMessageStats = async () => {
    try {
      const response = await api.get(`/stats/message-count`);
      return {
        total_messages: response.data.total_messages,
        is_increase: true,
        percentage_change: 0,
      };
    } catch (error) {
      console.error("Failed to fetch message stats:", error);
      throw error;
    }
  };
  
  export const fetchTaskStats = async () => {
    try {
      const response = await api.get("/stats/task-count");
      return {
        total_tasks: response.data.data.total_tasks,
        recent_tasks: response.data.data.recent_tasks,
        percentage_change: response.data.data.percentage_change,
        is_increase: response.data.data.is_increase,
      };
    } catch (error) {
      console.error("Failed to fetch task stats:", error);
      throw error;
    }
  };