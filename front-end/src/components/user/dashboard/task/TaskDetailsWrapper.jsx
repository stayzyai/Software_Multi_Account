import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import TaskInformation from "./TaskInformation";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllTask,
  getHostawayTask,
  getHostawayUser,
} from "../../../../helpers/TaskHelper";
import { setTasks } from "../../../../store/taskSlice";
import { setListings } from "../../../../store/listingSlice";
import { setHostawayUsers } from "../../../../store/hostawayUserSlice";
import { getAllListings } from "../../../../helpers/Message";
import TaskDetailsShimmer from "../../../common/shimmer/TaskDetailsShimmer";

const TaskDetailsWrapper = () => {
  const [taskInfo, setTaskInfo] = useState([]);
  const [taskList, setTaskList] = useState([]);
  const { taskId } = useParams();
  const tasks = useSelector((state) => state.tasks.tasks);
  const listings = useSelector((state) => state.listings.listings);
  const users = useSelector((state) => state.hostawayUser.users);

  const dispatch = useDispatch();
  const fetchData = async () => {
    const taskData = tasks.length === 0 ? await getHostawayTask() : tasks;
    if (tasks.length === 0) dispatch(setTasks(taskData));

    const listingData =
      listings.length === 0 ? await getAllListings() : listings;
    if (listings.length === 0) dispatch(setListings(listingData));

    const userData = users.length === 0 ? await getHostawayUser() : users;
    if (users.length === 0) dispatch(setHostawayUsers(userData));

    const allTask = getAllTask(taskData, listingData, userData);
    const task = allTask?.filter((item) => item.id == taskId);
    setTaskInfo(task);
    setTaskList(allTask);
  };

  useEffect(() => {
    fetchData();
  }, [taskId]);

  useEffect(() => {
    if (tasks.length && listings.length && users.length) {
      const allTask = getAllTask(tasks, listings, users);
      const task = allTask?.filter((item) => item.id == taskId);
      setTaskInfo(task);
      setTaskList(allTask);
    }
  }, [tasks, listings, users]);

  return taskInfo?.length !== 0 && taskList.length !== 0 ? (
    <TaskInformation taskInfo={taskInfo} taskList={taskList} taskId={taskId} fetchData={fetchData} />
  ) : (
    <TaskDetailsShimmer />
  );
};

export default TaskDetailsWrapper;
