import Header from "../Header";
import { FiChevronsLeft } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import TaskDetail from "./TaskDetails";
import { useState } from "react";

const TaskInformation = ({ taskInfo, taskList, fetchData }) => {
  const [openTaskChat, setOpenTaskChat] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex max-h-screen bg-[#fff]">
      <div
        className={`transition-all duration-300 bg-[#FCFDFC] ${
          openTaskChat
            ? "z-50 sm:z-0 fixed sm:sticky top-0 sm:top-0 h-full sm:h-auto left-0"
            : "hidden md:block"
        } lg:w-[220px] xl:w-[257px] min-w-[200px] border-r border-gray-300`}
      >
        <div className="flex gap-2 pl-6 mt-4">
          <button onClick={() => navigate("/user/tasks")}>
            <img src="/icons/left.svg" alt="down icon" width={14} height={10} />
          </button>
          <span
            style={{ WebkitTextStrokeWidth: "0.5px" }}
            className="text-2xl font-medium"
          >
            Tasks
          </span>
        </div>
        <div className="space-y-4 pt-4 h-[calc(100vh-64px)]  overflow-y-scroll scrollbar-hide">
          {taskList?.map((item, index) => (
            <div
              key={index}
              onClick={() => navigate(`/user/task/${item?.id}`)}
              className={`flex items-center space-x-2 cursor-pointer mt-[14px] w-full xl:px-3 px-3 h-12 border-b hover:bg-gray-50 ${taskInfo[0]["id"] == item.id ? "bg-green-200 hover:bg-green-200" : "bg-white" }`}
            >
              <div className="flex justify-between items-center w-full text-[#292D32] text-nowrap text-base">
                <div>
                  <p className="md:text-sm text-xs truncate whitespace-nowrap w-40">{item?.title}</p>
                </div>
                <div className="text-xs">{item?.date}</div>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => setOpenTaskChat(!openTaskChat)}
          className="bg-gray-100 p-1 py-2 rounded-lg md:hidden absolute top-1/2 right-0"
        >
          <FiChevronsLeft size={24} />
        </button>
      </div>
      <div className="flex-1 flex flex-col bg-[#FCFDFC]">
        <div className="bg-red-30">
          <div className="flex border-b border-gray-400">
            <div className="2xl:w-[65%] xl:w-[56%] lg:w-[38%]">
              {taskInfo?.map((item, index) => (
                <div key={index} className="py-4 flex gap-2">
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-xl text-nowrap font-normal ml-[14px]">
                        {item?.title}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden lg:block">
              <Header title="Chat" messages={true} task={true} />
            </div>
          </div>
        </div>
        <div className="flex h-[calc(100vh-61px)]">
          <div className="w-full h-full overflow-y-scroll scrollbar-hide">
            <TaskDetail
              setOpenTaskChat={setOpenTaskChat}
              openTaskChat={openTaskChat}
              fetchData={fetchData}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskInformation;
