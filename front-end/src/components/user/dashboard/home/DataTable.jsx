import { ChevronDown } from "lucide-react";
import StatusBadge from "./StatusBadge";

const DataTable = ({
  title,
  filters = [],
  columns,
  data,
  badgeType = "status",
  badgeColumn,
  className = "w-full",
}) => {
  return (
    <div
      className={`bg-white flex flex-col border-[0.2px] border-gray-400 shadow-xl rounded-[14px] ${className} p-4 pt-5`}
    >
      <div className="sm:flex justify-between items-center mb-7">
        <h1 className={`text-base ${title === "Listings"?"font-normal":"font-semibold"}`}>{title}</h1>
        {filters.length > 0 && (
          <div className="flex items-center sm:gap-5">
            {filters.map((filter) => (
              <div key={filter} className="flex items-center sm:gap-2 mr-8 mt-4 sm:mt-0">
                <p className="text-[13px] text-[#060606]">{filter}</p>
                <button className="p-0.5 hover:bg-gray-100 rounded-full">
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-[14px] border-b">
              {columns.map((column) => (
                <th style={title !== "Listings"? {"webkit-text-stroke-width":".5px", "-webkit-text-stroke-color": "#060606"}:{}}
                  key={column.key}
                  className={`pb-2 ${column.width} font-normal ${column.key === "status" ?"text-center":"text-left"}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`text-[13px]`}>
            {data.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={column.key} className={`py-2 ${column.key == "status" ?"text-center":"text-left"}`}>
                    {column.key === badgeColumn ? (
                      <StatusBadge status={row[column.key]} type={badgeType} />
                    ) : (
                      row[column.key]
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
