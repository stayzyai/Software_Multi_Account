import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { createTicket, updateTask } from "../../../../helpers/Message";
import { toast } from "sonner";
import {  getHostawayTask, getHostawayUser} from "../../../../helpers/TaskHelper";
import { setHostawayUsers } from "../../../../store/hostawayUserSlice";
import { setTasks } from "../../../../store/taskSlice";
import { useDispatch } from "react-redux";

const AddTask = ({
  setCreateTask,
  editedData = null,
  setSelectedTask,
  chatInfo,
  fetchedTasks,
}) => {
  const statusOptions = [
    { label: "In Progress", value: "inProgress" },
    { label: "Completed", value: "completed" },
    { label: "Pending", value: "pending" },
    { label: "Confirmed", value: "confirmed" },
  ];

  const users = useSelector((state) => state.hostawayUser.users);
  const [taskName, setTaskName] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [assignee, setAssignee] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch()

  const updateTasks = async () => {
    const taskData = await getHostawayTask();
    dispatch(setTasks(taskData));
    const userData = await getHostawayUser();
    dispatch(setHostawayUsers(userData));
  };

  useEffect(() => {
    if (editedData) {
      setTaskName(editedData.title || "");
      setTaskDescription(editedData.description) || "";
      setAssignee(editedData.assigned || "");
      setStatus(editedData.status || "");
    }
  }, [editedData]);

  const handleSave = async () => {
    if (!taskName.trim()) {
      toast.error("Title is required");
      return;
    }
    setLoading(true);
    const taskData = {
      title: taskName,
      description: taskDescription,
      assigneeUserId: Number(assignee),
      status: status,
      reservationId: chatInfo[0]?.reservationId || null,
      listingMapId: chatInfo[0]?.listingMapId || null,
      canStartFrom: new Date().toISOString().slice(0, 19).replace("T", " "),
    };
    let response;

    if (editedData) {
      response = await updateTask(taskData, editedData?.id);
    } else {
      response = await createTicket(taskData);
    }
    if (response) {
      toast.success(
        editedData ? "Task updated successfully." : "Task created successfully."
      );
      setLoading(false);
      updateTasks();
      setCreateTask(false);
      setSelectedTask(null);
      fetchedTasks();
      return;
    }
    toast.error("An error occurred while creating task. Please try again.");
    setLoading(false);
  };

  return (
    <div className="px-6">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Task name
        </label>
        <input
          type="text"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          className="w-full p-1 border border-gray-300 rounded-md text-md"
          placeholder="Task name"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Task description
        </label>
        <input
          type="text"
          value={taskDescription}
          onChange={(e) => setTaskDescription(e.target.value)}
          className="w-full p-1 border border-gray-300 rounded-md text-md"
          placeholder="Task Description"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Assignee
        </label>
        <select
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          className="w-full p-1 border border-gray-300 rounded-md bg-white"
        >
          <option value="Unassigned">Unassigned</option>
          {users?.map((user) => (
            <option key={user.id} value={user.id}>
              {user.firstName}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full p-1 border border-gray-300 rounded-md bg-white"
        >
          <option value="">Select</option>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex justify-between">
        <button
          onClick={() => {
            setCreateTask(false);
            setSelectedTask(null);
          }}
          className="w-24 p-1 border border-gray-300 bg-red-700 hover:bg-red-600 text-white rounded-md"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="w-24 p-1 bg-green-800 hover:bg-green-700 text-white rounded-md"
        >
          {loading ? "Saving..." : editedData ? "Update" : "Save"}
        </button>
      </div>
    </div>
  );
};

export default AddTask;
