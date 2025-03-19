import { ChevronDownIcon } from "lucide-react";

const DetectUpsell = ({
  periodDropdownRef,
  periodDropdownOpen,
  setPeriodDropdownOpen,
  setDetectPeriod,
  detectPeriod,
}) => {
  return (
    <div className="pb-1">
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
                {["1 day", "2 days", "3 days", "5 days", "7 days"].map(
                  (period) => (
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
                  )
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-800 mt-4">
        If the offer is detected within {detectPeriod}, the offer is detected
        immediately.
      </p>
    </div>
  );
};

export default DetectUpsell;
