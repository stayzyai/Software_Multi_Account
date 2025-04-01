import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { getAllListings } from "../../../../helpers/Message";
import { getHostawayTask, formatedTaskDetails, getHostawayUser } from "../../../../helpers/TaskHelper";
import { setListings } from "../../../../store/listingSlice";
import { setTasks } from "../../../../store/taskSlice";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { FiChevronsLeft } from "react-icons/fi";
import TaskMainContent from "../../../common/shimmer/TaskMaincontent";
import { setHostawayUsers } from "../../../../store/hostawayUserSlice";
import TaskStepper from "../task/TaskSteper"
import { getConversations } from "../../../../helpers/Message"
import { setConversations } from "../../../../store/conversationSlice"
import { useNavigate } from "react-router-dom";
import AddTask from "../Messages/CreateIssue";

const TaskDetail = ({ setOpenTaskChat, openTaskChat }) => {
  const dispatch = useDispatch();
  const [task, setTask] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [createTask, setCreateTask] = useState(false)
  const listings = useSelector((state) => state.listings.listings);
  const tasks = useSelector((state) => state.tasks.tasks);
  const users = useSelector((state) => state.hostawayUser.users);
  const conversations = useSelector((state) => state.conversation.conversations)
  const { taskId } = useParams();
  const navigate = useNavigate()

  const fetchDataIfEmpty = async () => {
    if (!listings.length) {
      const listingsData = await getAllListings();
      dispatch(setListings(listingsData));
    }
    if (!conversations.length) {
      const data = await getConversations();
      dispatch(setConversations(data));
    }

    if (!tasks.length) {
      const tasksData = await getHostawayTask();
      dispatch(setTasks(tasksData));
    }
    const userData = users?.length === 0 ? await getHostawayUser() : users;
    if (users?.length === 0) dispatch(setHostawayUsers(userData));
    const data = await formatedTaskDetails(listings, tasks, taskId, users, conversations);
    return data;
  };

  useEffect(() => {
    const fetchedData = async () => {
      setLoading(true);
      const data = await fetchDataIfEmpty();
      setTask(data);
      setLoading(false);
    };
    fetchedData();
  }, [taskId]);

  const handleOpen = (task) => {
    setOpenEdit(!openEdit);
    setSelectedTask(task);
  }

  if (loading) return <TaskMainContent />;

  return (
    <div className="p-10 lg:text-xl text-sm text-black rounded-lg">
      <div className="flex justify-between">
        <ul className="space-y-8">
          <li className="flex items-center gap-2">
            <span>Ticket: </span>#{task.id}
          </li>
          <li className="flex items-center gap-2">
            <span>Urgency: </span>
            <p className={`rounded-[20px] p-1 px-2 text-sm ${(task?.priority !== "Normal" && task?.priority !== 2) ? "text-[#E65F2B] bg-[#e65f2b2e]" : "text-yellow-700 bg-yellow-100"}`}>{task?.priority === 1 ? "Urgent" : task?.priority === 2 ? "Normal" : task?.priority}</p>
          </li>
          <li className="flex items-center gap-2">
            <span>Property: </span> {task?.listingName}
          </li>
          <li className="flex items-center gap-2">
            <span>Address: </span> {task?.listingAddress}
          </li>
          <li className="flex items-center gap-2">
            <span>Date Created:</span>{" "}
            {task?.startTime}
          </li>
          <li className="flex items-center gap-2">
            <span>Staff Assigned: </span> {task?.assignedName}
          </li>
        </ul>
        <div>
          <div>
            <button className={`px-3 py-1 bg-green-800 text-white rounded-md hover:bg-green-700 outline-none ${openEdit ? "hidden" : ""}`} onClick={() => handleOpen(task)}>Edit</button>
            {openEdit && <AddTask
            setCreateTask={setCreateTask}
            editedData={selectedTask}
            tasks={tasks}
            setSelectedTask={setSelectedTask}
            setOpenEdit={setOpenEdit}
            />}
          </div>
        </div>
      </div>
      <button
        onClick={() => setOpenTaskChat(!openTaskChat)}
        className={`bg-gray-100 p-1 py-2 rounded-lg absolute top-1/2 md:hidden left-0 ${openTaskChat && "hidden"
          }`}
      >
        <FiChevronsLeft size={24} />
      </button>
      <TaskStepper status={task.status} assigned={task.assigned} />
      <div className="flex justify-center">
        <button onClick={() => navigate(`/user/chat/${task.chatId}`)} className="px-6 py-0.5 text-black font-semibold bg-[#C7EADD] hover:bg-[#C7EAD1] rounded-lg flex justify-center text-[14px]">Go to Chat</button>
      </div>
    </div>
  );
};

export default TaskDetail;
