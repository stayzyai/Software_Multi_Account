import { ChevronDownIcon } from "lucide-react";
import { useState, useRef } from "react";

const DetectUpsell = ({
  periodDropdownRef,
  periodDropdownOpen,
  setPeriodDropdownOpen,
  setDetectPeriod,
  detectPeriod,
  upsellName,
  checkinTime,
  setCheckinTime
}) => {
  const [checkinTimeDropdownOpen, setCheckinTimeDropdownOpen] = useState(false);

  const checkinTimeRef = useRef(null);

  const timeOptions = [
    "12:00 AM", "1:00 AM", "2:00 AM", "3:00 AM", "4:00 AM", "5:00 AM",
    "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
    "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
    "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM", "11:00 PM",
  ];

  return (
    <div className="pb-1">
      <div className="flex gap-6 flex-wrap">
        {/* Period Dropdown */}
        <div className="flex items-center gap-2 mb-2">
          <label htmlFor="detect-period" className="text-sm font-medium">
            Detect upsell
          </label>

          <div className="relative w-[120px]" ref={periodDropdownRef}>
            <button
              id="detect-period"
              className="w-full flex text-sm items-center justify-between border rounded-md px-2 py-1 text-left focus:outline-none focus:ring-2 focus:ring-green-100"
              onClick={() => setPeriodDropdownOpen(!periodDropdownOpen)}
            >
              <span>{detectPeriod}</span>
              <ChevronDownIcon className="h-4 w-4 text-gray-500" />
            </button>

            {periodDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg">
                <ul className="py-1">
                  {["1 day", "2 days", "3 days", "5 days", "7 days"].map((period) => (
                    <li
                      key={period}
                      className="px-3 py-1 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setDetectPeriod(period);
                        setPeriodDropdownOpen(false);
                      }}
                    >
                      {period}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Time Dropdown */}
        <div className="flex items-center gap-2 mb-2">
          <label htmlFor="checkin-time" className="text-sm font-medium">
            before {upsellName?.includes("Post") || upsellName?.includes("Late") ? "check-out" : "check-in"} date at
          </label>
          <div className="relative w-[120px]" ref={checkinTimeRef}>
            <button
              id="checkin-time"
              className="w-full flex text-sm items-center justify-between border rounded-md px-2 py-1 text-left focus:outline-none focus:ring-2 focus:ring-green-100"
              onClick={() => setCheckinTimeDropdownOpen(!checkinTimeDropdownOpen)}
            >
              <span>{checkinTime}</span>
              <ChevronDownIcon className="h-4 w-4 text-gray-500" />
            </button>

            {checkinTimeDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg">
                <ul className="py-1 h-52 overflow-y-auto scrollbar-hide">
                  {timeOptions.map((time) => (
                    <li
                      key={time}
                      className="px-3 py-1 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setCheckinTime(time);
                        setCheckinTimeDropdownOpen(false);
                      }}
                    >
                      {time}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-800 mt-4">
        If the gap night is detected within {detectPeriod}, the offer is detected immediately.
        immediately.
      </p>
    </div>
  );
};

export default DetectUpsell;
