import TaskMainContent from "./TaskMaincontent";

const TaskDetailShimmer = () => {
  return (
    <div className="flex min-h-screen bg-gray-100 max-h-screen">
      {/* Left sidebar */}
      <div className="w-64 border-r bg-white overflow-y-scroll scrollbar-hide hidden sm:block">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6"></div>
            <div
              className={`text-xl font-medium w-24 h-7 animate-pulse bg-gray-200 rounded `}
            ></div>
          </div>
        </div>
        {[...Array(10)].map((_, index) => (
          <div className="p-4 border-b " key={index}>
            <div className="flex justify-between items-center">
              <div className="w-28 h-5 bg-gray-200 animate-pulse rounded"></div>
              <div className="w-20 h-4 bg-gray-200 animate-pulse rounded hidden xl:block"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex justify-end items-center p-[10px] border-b bg-white">
          <div className="flex items-center gap-4">
            <div
              className={`w-64 h-10 rounded-full bg-gray-100 flex items-center px-4 animate-pulse`}
            ></div>
            <div
              className={`w-10 h-10 rounded-full bg-gray-200 animate-pulse `}
            ></div>
          </div>
        </div>

        {/* Task details */}
        <TaskMainContent />
      </div>


    </div>
  );
};

export default TaskDetailShimmer;
