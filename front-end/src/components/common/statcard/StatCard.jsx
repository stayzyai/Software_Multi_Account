import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

const StatCard = ({ title, stats, selectedRange, icon }) => {

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm text-gray-500 font-medium">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {stats?.current_count || 0}
          {stats?.unit && (
            <span className="text-sm ml-1 font-normal">{stats?.unit}</span>
          )}
        </div>
        <p className={`text-xs flex items-center text-nowrap`}>
          {title !== "Avg Sentiment" ? (
            <div className="flex">
              {stats?.is_increase ? (
                <ArrowUpRight
                  className={`mr-1 h-4 w-4 ${
                    stats?.is_increase ? "text-green-500" : "text-red-500"
                  }`}
                />
              ) : (
                <ArrowDownRight
                  className={`mr-1 h-4 w-4 ${
                    stats?.is_increase ? "text-green-500" : "text-red-500"
                  }`}
                />
              )}
              {Math.abs(parseFloat(stats?.percentage_change)).toFixed(2)} %{" "}
            </div>
          ) : (
            <p className="mx-2 text-lg">
              {stats?.current_count == "N/A"
                ? "😐"
                : stats?.is_increase == "increase" &&
                  stats?.percentage_change >= 50
                ? "😊"
                : stats?.is_increase == "increase" &&
                  stats?.percentage_change < 50
                ? "😐"
                : "😟"}{" "}
            </p>
          )}
          {stats?.is_increase ? " increase" : " decrease"} from last{" "}
          {selectedRange
            ? selectedRange !== "Last 30 days"
              ? "week"
              : "month"
            : "month"}
        </p>
        {stats?.subtitle && (
          <p className="text-xs text-gray-500 mt-1">{stats?.subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
