import api from "@/api/api";

export const fetchResponseQuality = async (selectedRange) => {
  const days = selectedRange === "Last 30 days" ? 30 : selectedRange === "Last 7 days" ? 7 : 30;
  try {
    const response = await api.get(`/stats/response-quality?days=${days}`);

    if (response.status === 200) {
      return {
        average_score: response.data.average_score,
        is_increase: response.data.is_increase,
        percentage_change: response.data.percentage_change,
      };
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    console.error("Failed to fetch response quality:", error);
    throw error;
  }
};


export const fetchMessageStats = async (selectedRange) => {
  const days = selectedRange === "Last 30 days" ? 30 : selectedRange === "Last 7 days" ? 7 : 30;
  try {
    const response = await api.get(`/stats/message-count`);
    if(response.status === 200) {
      return {
        total_messages: response.data.total_messages,
        is_increase: response.data.is_increase,
        percentage_change: response.data.percentage_change,
      };
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    console.error("Failed to fetch message stats:", error);
    throw error;
  }
};

export const fetchTaskStats = async (selectedRange) => {
  const days = selectedRange === "Last 30 days" ? 30 : selectedRange === "Last 7 days" ? 7 : 30;
  try {
    const response = await api.get(`/stats/task-count?days=${days}`);
    if(response.status === 200){
      return {
        total_tasks: response.data.data.total_tasks,
        recent_tasks: response.data.data.recent_tasks,
        percentage_change: response.data.data.percentage_change,
        is_increase: response.data.data.is_increase,
      };
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    console.error("Failed to fetch task stats:", error);
    throw error;
  }
};

export const conversationsTimeResponse = async (selectedRange) => {
  const days = selectedRange === "Last 30 days" ? 30 : selectedRange === "Last 7 days" ? 7 : 30;
  try {
    const response = await api.get(`/stats/conversation-time?days=${days}`);
    if(response.status === 200){
      return {
        average_response_time: response.data.average_response_time || 0,
        is_increase: response.data.is_increase || false,
        percentage_change: response.data.percentage_change || 0,
        total_conversations: response.data.total_conversations || 0,
      };
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    console.error("Failed to fetch task stats:", error);
    throw error;
  }
};
