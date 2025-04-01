import { useState, useEffect } from "react";
import StatCard from "@/components/common/statcard/StatCard";
import {
  MessageCircle,
  Building,
  Users,
  Smile,
  ChevronDown,
} from "lucide-react";
import axios from "axios";

export const Overview = () => {
  const [responseQuality, setResponseQuality] = useState({
    average_score: 0,
    is_increase: false,
    percentage_change: 0,
  });
  
  const [messageStats, setMessageStats] = useState({
    total_messages: 0,
    is_increase: false,
    percentage_change: 0,
  });
  
  const [conversationTime, setConversationTime] = useState({
    average_response_time: 0,
    is_increase: false,
    percentage_change: 0,
    total_conversations: 0,
  });
  
  const baseURL = import.meta.env.VITE_API_HOST;
  
  useEffect(() => {
    // Fetch data for the dashboard
    const fetchDashboardData = async () => {
      try {
        // Fetch response quality data
        console.log("Fetching response quality data");
        const qualityResponse = await axios.get(`${baseURL}/stats/response-quality`);
        console.log("Response quality data:", qualityResponse.data);
        setResponseQuality({
          average_score: qualityResponse.data.average_score,
          is_increase: true,  
          percentage_change: 0,
        });
        
        // Fetch message count data
        console.log("Fetching message count data");
        const messageResponse = await axios.get(`${baseURL}/stats/message-count`);
        console.log("Message count data:", messageResponse.data);
        setMessageStats({
          total_messages: messageResponse.data.total_messages,
          is_increase: true,
          percentage_change: 0,
        });
        
        // Fetch conversation time data
        console.log("Fetching conversation time data");
        const timeResponse = await axios.get(`${baseURL}/stats/conversation-time`);
        console.log("Conversation time data:", timeResponse.data);
        setConversationTime({
          average_response_time: timeResponse.data.average_response_time || 0,
          is_increase: timeResponse.data.is_increase || false,
          percentage_change: timeResponse.data.percentage_change || 0,
          total_conversations: timeResponse.data.total_conversations || 0,
        });
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      }
    };
    
    fetchDashboardData();
  }, []);

  return (
    <>
      <div>
        <div className="flex items-center justify-between mt-2 px-2">
          <span style={{ WebkitTextStrokeWidth: "0.5px"}} className="text-[22px] text-[#060606]">
            Overview
          </span>
          <div className="flex gap-3 items-center bg-white rounded-[17px] p-[2px_14px] h-[34px] ">
            <p className="text-sm text-center"> Last 30 days</p>
            <button className="p-1 hover:bg-gray-100 rounded-full">
              <ChevronDown className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-3 gap-6 mb-3 p-4 md:p-1 mt-2 lg:grid-cols-4 lg:gap-6">
          <StatCard
            title="Total Automated Messages"
            icon={<MessageCircle />}
            stats={{
              current_count: messageStats.total_messages,
              is_increase: messageStats.is_increase,
              percentage_change: messageStats.percentage_change,
            }}
          />
          <StatCard
            title="Tasks"
            icon={<Building />}
            stats={{
              current_count: 12,
              is_increase: false,
              percentage_change: 8,
            }}
          />
          <StatCard
            title="Conversation Time"
            icon={<Users />}
            stats={{
              current_count: conversationTime.average_response_time,
              is_increase: conversationTime.is_increase,
              percentage_change: conversationTime.percentage_change,
              unit: "sec",
              subtitle: `From ${conversationTime.total_conversations || 0} conversations`
            }}
          />
          <StatCard
            title="Avg Response Quality"
            icon={<Smile />}
            stats={{
              current_count: responseQuality.average_score,
              is_increase: responseQuality.is_increase,
              percentage_change: responseQuality.percentage_change,
            }}
          />
        </div>
      </div>
    </>
  );
};
