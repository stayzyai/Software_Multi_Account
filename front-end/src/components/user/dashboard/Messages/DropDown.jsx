const Dropdown = ({ label, options, isOpen, onClick, onSelect, selectedValue }) => {

  const displayValue =
    label === "Listing" || label === "Task"
      ? options.find(option => option.id === selectedValue)?.name || label
      : selectedValue || label;

  return (
    <div className="relative border border-gray-300 hover:border-gray-600 py-1.5 px-3 rounded-sm">
      <div
        className="flex md:gap-2 text-[14px] cursor-pointer items-center"
        onClick={onClick}
      >
        <button>{displayValue}</button>
        <img
          src="/icons/down.svg"
          alt="down"
          width={14}
          height={14}
          className={`transform transition-transform ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
        />
      </div>

      {isOpen && (
        <div className={`absolute mt-2 w-28 scrollbar-hide bg-white shadow-lg border rounded-md p-2 z-10 max-h-60 overflow-y-scroll ${label === "Task" ? "-left-20" : "-left-4 md:-left-10"}`}>
          <div
            className="p-2 text-red-500 hover:bg-red-50 cursor-pointer min-h-6"
            onClick={() => {
              onSelect(label, "");
              onClick();
            }}
          >
            Clear Filter
          </div>

          {options.map((option, index) => (
            <div key={index}
              className="p-2 hover:bg-gray-50 cursor-pointer min-h-6"
              onClick={() => {
                const value = label === "Listing" || label === "Task" ? option.id : option;
                onSelect(label, value);
                onClick();
              }}
            >
              {label === "Listing" || label === "Task" ? option.name : option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
