import { getConversations } from "./Message";
import api from "@/api/api";

const getListingData = (listings) => {
  const listingsData = {
    title: "Listings",
    columns: [
      { key: "property", label: "Property", width: "w-[25%]" },
      { key: "address", label: "Address", width: "w-[50%]" },
      { key: "occupancy", label: "Occupancy", width: "w-[25%]" },
    ],
    data: listings?.slice(0, 5),
  };

  return listingsData;
};

const mapStatus = (status) => {
  const statusMap = {
    inProgress: "In Progress",
    completed: "Completed",
    delayed: "Delayed",
    atRisk: "At Risk",
  };
  return statusMap[status] || "Pending";
};

const transformData = (tasks, userData) => {
  return tasks.map((task) => {
    const user = userData.find((item) => item.id === task.assigneeUserId);
    return {
      name: task.title,
      staff: user ? user.firstName : "Unassigned",
      status: mapStatus(task.status),
    };
  });
};
const formatedTask = (task, userData) => {
  const tasksData = {
    title: "Recent Tasks",
    filters: ["Project", "Staff", "Status"],
    columns: [
      { key: "name", label: "Name", width: "w-[45%]" },
      { key: "staff", label: "Staff", width: "w-[35%]" },
      { key: "status", label: "Status", width: "w-[20%]" },
    ],
    data: transformData(task, userData),
  };
  return tasksData;
};

const getAllTask = (tasks, listings, users) => {
  return tasks?.map((task) => {
    const listing = listings?.find(
      (listing) => listing.id === task.listingMapId
    );
    const user = users?.find((item) => item.id === task?.assigneeUserId);

    return {
      id: task.id,
      title: task?.title,
      address: listing.address,
      urgency: task?.priority ? task.priority : "Normal",
      assigned: user ? user.firstName : "Unassigned",
      date: formatDate(task.canStartFrom?.split(" ")[0]),
    };
  });
};

const getCompletedTasks = (tasks, listings, users) => {
  return tasks
    ?.filter((task) => task.status === "completed")
    .map((task) => {
      const listing = listings?.find(
        (listing) => listing.id === task.listingMapId
      );
      const user = users?.find((item) => item.id === task?.assigneeUserId);

      return {
        id: task.id,
        title: task?.title,
        address: listing?.address || "No address available",
        urgency: task?.priority ? (task.priority === 1 ?"Urgent" :"Normal") : "Normal",
        assigned: user ? user.firstName : "Unassigned",
        date: formatDate(task.canStartFrom?.split(" ")[0]),
      };
    });
};

const getNonCompletedTasks = (tasks, listings, users) => {
  return tasks
    ?.filter((task) => task.status !== "completed")
    .map((task) => {
      const listing = listings?.find(
        (listing) => listing.id === task.listingMapId
      );
      const user = users?.find((item) => item.id === task?.assigneeUserId);

      return {
        id: task.id,
        title: task?.title,
        address: listing?.address || "No address available",
        urgency: task?.priority ? (task.priority === 1 ?"Urgent" :"Normal") : "Normal",
        assigned: user ? user.firstName : "Unassigned",
        date: formatDate(task.canStartFrom?.split(" ")[0]),
      };
    });
};


const getHostawayTask = async (limit = null) => {
  try {
    const url = limit
      ? `/hostaway/get-all/tasks?limit=${limit}`
      : `/hostaway/get-all/tasks`;
    const response = await api.get(url);
    if (response?.data?.detail?.data?.result) {
      const data = response?.data?.detail?.data?.result;
      return data;
    }
    return [];
  } catch (error) {
    console.log("Error at get hostaway task", error);
    return [];
  }
};

const getHostawayUser = async (limit = null) => {
  try {
    const url = limit
      ? `/hostaway/get-all/users?limit=${limit}`
      : `/hostaway/get-all/users`;
    const response = await api.get(url);
    if (response?.data?.detail?.data?.result) {
      const data = response?.data?.detail?.data?.result;
      return data;
    }
    return [];
  } catch (error) {
    console.log("Error at get users", error);
    return [];
  }
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const [year, month, day] = dateString?.split("-");
  return `${month}/${day}/${year}`;
};

const formatedTaskDetails = async (
  listings,
  tasks,
  taskId,
  users,
  conversations
) => {
  const task = tasks?.find((item) => item.id == taskId);
  const listing = listings?.find(
    (listing) => listing?.id == task?.listingMapId
  );
  const user = users?.find((item) => item.id == task.assigneeUserId);
  const date = task?.canStartFrom?.split(" ")[0];
  const conversation = conversations.find(
    (item) => item.reservationId === task.reservationId
  );

  return {
    id: task.id,
    title: task.title,
    status: task.status === "inProgress" ? "In Progress" : task.status,
    startTime: formatDate(date),
    priority: task.priority || "Normal",
    listingName: listing ? listing.name : "Unknown Listing",
    listingAddress: listing.address,
    reservationId: task.reservationId,
    assigned: user ? user?.firstName : "Unassigned",
    chatId: conversation?.id,
  };
};

const TaskOverview = (tasks, hostawayUsers) => {
  return tasks?.map((task, index) => {
    const user = hostawayUsers.find((user) => user.id == task?.assigneeUserId);

    return {
      id: tasks?.id,
      name: task?.title,
      status: task?.status,
      staff: user ? user?.firstName : "Unassigned",
    };
  });
};

const formattedIssues = (tasks, users, chatInfo) => {
  const reservationId = chatInfo[0]?.reservationId;
  const listingMapId = chatInfo[0]?.listingMapId;
  const allTasks = tasks?.filter((task) => task.reservationId == reservationId) || [];
  return allTasks.map((task) => {
    // const user = users?.find((item) => item.id == task.assigneeUserId);
    return {
      id: task.id,
      title: task.title,
      status: task.status,
      reservationId: task.reservationId,
      assigned:  task.assigneeUserId  ? task.assigneeUserId : "",
      description: task.description,
      listingMapId: listingMapId,
      priority: task.priority,
    };
  });
};


export {
  getListingData,
  formatedTask,
  getAllTask,
  getHostawayTask,
  getHostawayUser,
  formatedTaskDetails,
  TaskOverview,
  getCompletedTasks,
  formattedIssues,
  getNonCompletedTasks
};
