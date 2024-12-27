import StatCard from "@/components/common/statcard/StatCard";
import {
  MessageCircle,
  Building,
  Users,
  Smile,
  ChevronDown,
} from "lucide-react";

export const Overview = () => {
  return (
    <>
      <div>
        <div className="flex items-center justify-between mt-4 px-4">
          <span className="text-[22px] font-medium text-[#060606]">
            Overview
          </span>
          <div className="flex items-center">
            <p className="text-sm text-center"> Last 30 days</p>
            <button className="p-1 hover:bg-gray-100 rounded-full">
              <ChevronDown className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-3 gap-6 mb-8 p-4 md:p-1 mt-2 lg:grid-cols-4 lg:gap-6">
          <StatCard
            title="Total Automated Messages"
            icon={<MessageCircle />}
            stats={{
              current_count: 10,
              is_increase: true,
              percentage_change: 15,
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
              current_count: 5,
              is_increase: true,
              percentage_change: 12,
            }}
          />
          <StatCard
            title="Avg Response Quality"
            icon={<Smile />}
            stats={{
              current_count: 14,
              is_increase: false,
              percentage_change: 5,
            }}
          />
        </div>
      </div>
    </>
  );
};
