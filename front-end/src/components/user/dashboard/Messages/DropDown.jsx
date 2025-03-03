const Dropdown = ({ label, options, isOpen, onClick, onSelect, selectedValue }) => {

  const displayValue =
    label === "Listing"
      ? options.find(option => option.id === selectedValue)?.name || label
      : selectedValue || label;

  return (
    <div className="relative">
      <div
        className="flex gap-2 text-[14px] cursor-pointer items-center"
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
        <div className={`absolute mt-2 w-40 bg-white shadow-lg border rounded-md p-2 z-10 max-h-60 overflow-y-scroll ${label === "Task" ? "-left-20" : "-left-10"}`}>
          <div
            className="p-2 text-red-500 hover:bg-red-50 cursor-pointer min-h-6"
            onClick={() => {
              onSelect(label, "");
              onClick();
            }}
          >
            Clear Filter
          </div>

          {options.map((option) => (
            <div
              key={label === "Listing" ? option.id : option}
              className="p-2 hover:bg-gray-50 cursor-pointer min-h-6"
              onClick={() => {
                const value = label === "Listing" ? option.id : option;
                onSelect(label, value);
                onClick();
              }}
            >
              {label === "Listing" ? option.name : option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
