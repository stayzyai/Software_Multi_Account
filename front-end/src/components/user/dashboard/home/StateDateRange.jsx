import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const DateRangeDropdown = ({setSelectedRange, selectedRange, handleSelect, isOpen, setIsOpen}) => {
  // const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="flex gap-3 items-center bg-white rounded-[17px] p-[4px] h-[34px] cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <p className="text-sm text-center">{selectedRange}</p>
        <button className="p-1 hover:bg-gray-100 rounded-full">
          <ChevronDown className="h-4 w-4 text-gray-600" />
        </button>
      </div>
      {isOpen && (
        <div className="absolute left-0 mt-2 w-full bg-white shadow-md rounded-lg overflow-hidden">
          <button
            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            onClick={() => handleSelect("Last 30 days")}
          >
            Last 30 days
          </button>
          <button
            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            onClick={() => handleSelect("Last 7 days")}
          >
            Last 7 days
          </button>
        </div>
      )}
    </div>
  );
};

export default DateRangeDropdown;
