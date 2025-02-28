import { IoMdClose } from "react-icons/io";
import MultipleSelectCheckmarks from "./MuitiSelector";

const FilterModal = ({
  setOpenFilter,
  listings,
  filters,
  setFilters,
  handleApplyFilter,
  setFilteredConversations,
}) => {
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleClearFilter = () => {
    setOpenFilter(false);
    setFilters({ quickFilter: "", selectedListing: "" });
    setFilteredConversations([]);
  };

  return (
    <div className="bg-black bg-opacity-0 flex justify-center items-center absolute top-16">
      <div className="bg-white p-4 rounded-lg shadow-lg w-64 border">
        <div className="flex justify-between">
          <h2 className="text-lg font-semibold mb-4">Filter conversations</h2>
          <div
            className="cursor-pointer hover:bg-gray-100 mb-6 p-1 rounded"
            onClick={() => setOpenFilter(false)}
          >
            <IoMdClose size={18} />
          </div>
        </div>
        <div className="space-y-3">
          <select
            className="w-full p-2 border border-gray-400 rounded bg-white"
            value={filters.quickFilter}
            onChange={(e) => handleFilterChange("quickFilter", e.target.value)}
          >
            <option value="">Quick filters</option>
            <option value="last_message">Guest last message</option>
            <option value="staying_guests">Staying guests</option>
            <option value="today_checkins">Today's check-ins</option>
            <option value="tomorrow_checkins">Tomorrow's check-ins</option>
            <option value="next_7_days">Next 7 days check-ins</option>
          </select>

          <MultipleSelectCheckmarks
            value={filters.selectedListing}
            onChange={(value) => handleFilterChange("selectedListing", value)}
            listings={listings}
          />
        </div>
        <div className="flex justify-between mt-4">
          <button
            className="px-2 py-1 text-sm font-medium border rounded text-gray-900 hover:bg-gray-100"
            onClick={handleClearFilter}
          >
            Clear filters
          </button>

          <button
            className="px-2 py-1 text-sm bg-green-800 text-white rounded hover:bg-green-700"
            onClick={handleApplyFilter}
          >
            Apply filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
