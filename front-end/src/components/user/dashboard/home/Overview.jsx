import { useState, useEffect } from "react";
import StatCard from "@/components/common/statcard/StatCard";
import {
  MessageCircle,
  Building,
  Users,
  Smile,
  ChevronDown,
} from "lucide-react";
import api from "@/api/api";
import ShimmerOverview from "../../../common/shimmer/CardShimmer";

export const Overview = () => {
  const [loading, setLoading] = useState(true);
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

  const [taskStats, setTaskStats] = useState({
    total_tasks: 0,
    recent_tasks: 0,
    percentage_change: 0,
    is_increase: false,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch response quality data
        const qualityResponse = await api.get(`/stats/response-quality`);
        setResponseQuality({
          average_score: qualityResponse.data.average_score,
          is_increase: qualityResponse.data.is_increase,
          percentage_change: qualityResponse.data.percentage_change,
        });

        const messageResponse = await api.get(`/stats/message-count`);
        setMessageStats({
          total_messages: messageResponse.data.total_messages,
          is_increase: true,
          percentage_change: 0,
        });
        const taskResponse = await api.get("/stats/task-count");
        setTaskStats({
          total_tasks: taskResponse.data.data.total_tasks,
          recent_tasks: taskResponse.data.data.recent_tasks,
          percentage_change: taskResponse.data.data.percentage_change,
          is_increase: taskResponse.data.data.is_increase,
        });
        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.error("Failed to fetch dashboard data:", error);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <>
      {loading ? (
        <ShimmerOverview />
      ) : (
        <div>
          <div className="flex items-center justify-between mt-2 px-2">
            <span
              style={{ WebkitTextStrokeWidth: "0.5px" }}
              className="text-[22px] text-[#060606]"
            >
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
                current_count: taskStats.total_tasks,
                is_increase: taskStats.is_increase,
                percentage_change: taskStats.percentage_change,
              }}
            />
            <StatCard
              title="Conversation Time"
              icon={<Users />}
              stats={{
                current_count: 5,
                is_increase: true,
                percentage_change: 12,
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
      )}
    </>
  );
};
