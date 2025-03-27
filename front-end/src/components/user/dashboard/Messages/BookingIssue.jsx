import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import AddTask from "./CreateIssue";
import {
  formattedIssues,
  getHostawayTask,
  getHostawayUser,
} from "../../../../helpers/TaskHelper";
import { useNavigate, useParams } from "react-router-dom";
import IssueLoader from "./IssueLoader";

const BookingIssue = ({ chatInfo }) => {
  const [CreateTask, setCreateTask] = useState(false);
  const [taskList, setTaskList] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { messageId } = useParams();

  const formateTaskList = (tasks, users) => {
    const data = formattedIssues(tasks, users, chatInfo);
    setTaskList(data);
  };

  const fetchedTasks = async () => {
    setLoading(true);
    const tasksData =  await getHostawayTask();
    const userData =  await getHostawayUser();
    formateTaskList(tasksData, userData);
    setCreateTask(false);
    setSelectedTask(null);
    setLoading(false);
  };
  useEffect(() => {
    fetchedTasks();
  }, [messageId]);

  return (
    <div className="px-2 w-full font-sans">
      {!CreateTask ? (
        <div>
          {!loading ? (
            <>
              {taskList?.map((item, index) => {
                return (
                  <div
                    className="bg-white flex items-center justify-between px-4 rounded-md py-2 hover:bg-gray-50 border-b border-gray-300"
                    key={index}
                  >
                    <p
                      onClick={() => {
                        setSelectedTask(item);
                        setCreateTask(true);
                      }}
                      className="font-semibold text-xs cursor-pointer"
                    >
                      {item?.title}
                    </p>
                    <button
                      className="bg-[#C7EADD] hover:bg-[#C7EAD1] p-1 text-xs px-2 rounded-full font-semibold"
                      onClick={() => navigate(`/user/task/${item.id}`)}
                    >
                      Inspect
                    </button>
                  </div>
                );
              })}
            </>
          ) : (
            <IssueLoader/>
          )}
          <button
            onClick={() => setCreateTask(true)}
            className="flex items-center bg-white hover:bg-gray-50 p-2 rounded-lg w-full mt-4"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create task
          </button>
        </div>
      ) : (
        <AddTask
          setCreateTask={setCreateTask}
          editedData={selectedTask}
          setSelectedTask={setSelectedTask}
          chatInfo={chatInfo}
          fetchedTasks={fetchedTasks}
        />
      )}
    </div>
  );
};

export default BookingIssue;
