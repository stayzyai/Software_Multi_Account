import { useEffect, useState } from "react";
import Header from "../Header";
import { setTasks } from "../../../../store/taskSlice";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import {
  getAllTask,
  getHostawayTask,
  getHostawayUser,
  getCompletedTasks,
} from "../../../../helpers/TaskHelper";
import { getAllListings } from "../../../../helpers/Message";
import Tasks from "./Tasks";
import TaskTableShimmer from "../../../common/shimmer/TaskTableShimmer";
import { setHostawayUsers } from "../../../../store/hostawayUserSlice";
import { setListings } from "../../../../store/listingSlice";

const TasksTab = () => {
  const dispatch = useDispatch();
  const tasks = useSelector((state) => state.tasks.tasks);
  const listings = useSelector((state) => state.listings.listings);
  const users = useSelector((state) => state.hostawayUser.users);
  const [formatedTask, setFormatedTask] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completedTask, setCompletedTask] = useState([]);
  const [showCompeltedTask, setShowCompletdedTask] = useState(false);

  const fetchData = async () => {
    try {
      const taskData = tasks.length === 0 ? await getHostawayTask() : tasks;
      if (tasks.length === 0) dispatch(setTasks(taskData));

      const listingData =
        listings.length === 0 ? await getAllListings() : listings;
      if (listings.length === 0) dispatch(setListings(listingData));

      const userData = users.length === 0 ? await getHostawayUser() : users;
      if (users.length === 0) dispatch(setHostawayUsers(userData));

      const allTask = getAllTask(taskData, listingData, userData);
      const allCompletedTask = getCompletedTasks(
        taskData,
        listingData,
        userData
      );
      setCompletedTask(allCompletedTask);
      setFormatedTask(allTask);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data: ", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns = ["Issue", "Address", "Urgency", "Assigned", "Date"];

  return (
    <>
      <div className="pt-[74px]">
        <Header title={"Tasks"} />
        {!loading ? (
          <>
            <Tasks columns={columns} tasks={formatedTask} />
            {showCompeltedTask && (
              <Tasks columns={columns} tasks={completedTask} />
            )}
            <div className="flex text-base w-full justify-center py-4 cursor-pointer">
              <button
                onClick={() => setShowCompletdedTask(!showCompeltedTask)}
                className="bg-[#E3E9F2] text-nowrap rounded-2xl h-8 flex gap-1 items-center px-3 py-3"
              >
                <p>
                  {!showCompeltedTask ? "See Completed Tasks" : "See All Tasks"}
                </p>
                <img
                  src="/icons/down.svg"
                  width={18}
                  height={20}
                  className={`${
                    !showCompeltedTask ? "font-bold" : "rotate-180"
                  }`}
                />
              </button>
            </div>
          </>
        ) : (
          <div className="p-10">
            <TaskTableShimmer />
          </div>
        )}
      </div>
    </>
  );
};

export default TasksTab;
