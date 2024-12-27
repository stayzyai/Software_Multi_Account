import { Search, SlidersHorizontal, ArrowDownAZ } from "lucide-react";

const FilterBar = ({ onSearch, onFilter, onSort }) => {
  return (
    <div className="bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 pb-2 px-10">
      <div className="flex gap-5 w-full sm:w-auto">
        <button
          onClick={onSort}
          className="flex-1 sm:flex-none px-4 text-[#000606] rounded-lg flex items-center justify-center gap-2"
        >
          Channels
        </button>
        <button
          onClick={onFilter}
          className="flex-1 sm:flex-none px-4 text-[#000606] rounded-lg flex items-center justify-center gap-2"
        >
          {/* <SlidersHorizontal size={16} /> */}
          Filter
        </button>
        <button
          onClick={onSort}
          className="flex-1 sm:flex-none px-4 text-[#000606] rounded-lg flex items-center justify-center gap-2"
        >
          {/* <ArrowDownAZ size={16} /> */}
          Sort
        </button>
      </div>

      {/* <div className="relative w-full sm:w-auto sm:ml-4">
        <Search
          color="green"
          className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={16}
        />
        <input
          type="text"
          placeholder="Search..."
          className="w-full sm:w-[250px] h-10 pl-9 pr-3 bg-gray-200 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-700 text-sm"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div> */}
    </div>
  );
};

export default FilterBar;
