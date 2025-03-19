const TaskMainContent = () => {
  return (
    <div className="p-6 flex-1 bg-white overflow-y-scroll scrollbar-hide">
      <div className="mb-6">
        <h1
          className={`text-2xl font-bold mb-4 w-48 h-8 bg-gray-200 animate-pulse rounded `}
        ></h1>
        <div
          className={`mb-4 w-64 h-6 bg-gray-200 animate-pulse rounded `}
        ></div>
        <div
          className={`inline-block px-4 py-1 rounded-full w-28 h-8 bg-gray-200 animate-pulse `}
        ></div>
      </div>

      <div className="space-y-4">
        {[
          { label: "Schedule Time:", value: "01/02/2025, 09:30:00" },
          { label: "Started At:", value: "26/02/2025, 09:53:08" },
          { label: "Linked Listing:", value: "Golden Sands Retreat" },
          { label: "Guest Number:", value: "2" },
          { label: "Priority:", value: "Normal" },
          { label: "Cost:", value: "$100 USD" },
        ].map((_, index) => (
          <div key={index} className="flex items-start gap-4">
            <div>
              <div className="flex gap-20">
                <div
                  className={`font-medium  w-40 h-5 bg-gray-200 animate-pulse rounded $`}
                ></div>
                <div className="w-48 h-5 bg-gray-200 animate-pulse rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="py-20">
        <div className="flex justify-between items-center">
          <div className="flex flex-col items-center">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-green-200 via-green-100 to-green-200"></div>
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-24 mt-2"></div>
          </div>
          <div className="flex-1 h-1 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200"></div>
          <div className="flex flex-col items-center">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-green-200 via-green-100 to-green-200"></div>
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-24 mt-2"></div>
          </div>
          <div className="flex-1 h-1 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200"></div>
          <div className="flex flex-col items-center">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200"></div>
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-24 mt-2"></div>
          </div>
          <div className="flex-1 h-1 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200"></div>
          <div className="flex flex-col items-center">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200"></div>
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-24 mt-2"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskMainContent;
