import { useState, useEffect } from "react";
import StatCard from "@/components/common/statcard/StatCard";
import {
  MessageCircle,
  Building,
  Users,
  Smile,
} from "lucide-react";
import ShimmerOverview from "../../../common/shimmer/CardShimmer";
import { fetchResponseQuality, fetchMessageStats, fetchTaskStats, conversationsTimeResponse } from "../../../../helpers/statHelper";
import DateRangeDropdown from "./StateDateRange"

export const Overview = () => {
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState("Last 30 days");
  const [isOpen, setIsOpen] = useState(false);
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


  const [conversationTime, setConversationTime] = useState({
    average_response_time: 0,
    is_increase: false,
    percentage_change: 0,
    total_conversations: 0,
  });

  const handleSelect = async (range) => {
    try {
      setSelectedRange(range);
      setIsOpen(false);
      setLoading(true);

      // Fetch all stats in parallel
      const [qualityData, messageData, taskData, timeResponse] = await Promise.all([
        fetchResponseQuality(range),
        fetchMessageStats(range),
        fetchTaskStats(range),
        conversationsTimeResponse(range),
      ]);

      // Update state with fetched data
      setResponseQuality(qualityData);
      setMessageStats(messageData);
      setTaskStats(taskData);
      setConversationTime(timeResponse);
    } catch (error) {
      console.error("Error fetching data in handleSelect:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load initial data on mount
  useEffect(() => {
    handleSelect("Last 30 days"); // Default range on page load
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
              {/* <p className="text-sm text-center"> Last 30 days</p>
              <button className="p-1 hover:bg-gray-100 rounded-full">
                <ChevronDown className="h-4 w-4 text-gray-600" />
              </button> */}
              <DateRangeDropdown selectedRange={selectedRange} setSelectedRange={setSelectedRange} isOpen={isOpen} setIsOpen={setIsOpen} handleSelect={handleSelect} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 md:gap-3 gap-6 mb-3 p-4 md:p-1 mt-2 xl:grid-cols-4 xl:gap-6">
            <StatCard
              title="Total Automated Messages"
              icon={<MessageCircle />}
              stats={{
                current_count: messageStats.total_messages,
                is_increase: messageStats.is_increase,
                percentage_change: messageStats.percentage_change,
              }}
              selectedRange={selectedRange}
            />
            <StatCard
              title="Tasks"
              icon={<Building />}
              stats={{
                current_count: taskStats.total_tasks,
                is_increase: taskStats.is_increase,
                percentage_change: taskStats.percentage_change,
              }}
              selectedRange={selectedRange}
            />
            <StatCard
              title="Conversation Time"
              icon={<Users />}
              stats={{
                current_count: conversationTime.average_response_time,
                is_increase: conversationTime.is_increase,
                percentage_change: conversationTime.percentage_change,
                unit: "Mins"
              }}
              selectedRange={selectedRange}
            />
            <StatCard
              title="Avg Response Quality"
              icon={<Smile />}
              stats={{
                current_count: responseQuality.average_score,
                is_increase: responseQuality.is_increase,
                percentage_change: responseQuality.percentage_change,
              }}
              selectedRange={selectedRange}
            />
          </div>
        </div>
      )}
    </>
  );
};
