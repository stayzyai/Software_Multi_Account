import { useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const Tasks = ({ columns, tasks }) => {
  const navigate = useNavigate();
  const [urgencyFilter, setUrgencyFilter] = useState("All");
  const [assignedFilter, setAssignedFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");

  const handleClick = (id) => {
    navigate(`/user/task/${id}`);
  };

  const filterByDate = (taskDate) => {
    const today = dayjs();
    const taskDay = dayjs(taskDate, "YYYY-MM-DD");

    switch (dateFilter) {
      case "Today":
        return taskDay.isSame(today, "day");
      case "Yesterday":
        return taskDay.isSame(today.subtract(1, "day"), "day");
      case "Last 7 Days":
        return taskDay.isAfter(today.subtract(7, "day"));
      case "Last Month":
        return taskDay.isAfter(today.subtract(1, "month"));
      default:
        return true;
    }
  };

  const filteredTasks = tasks?.filter((task) => {
    return (
      (urgencyFilter === "All" || task.urgency === urgencyFilter) &&
      (assignedFilter === "All" || task.assigned === assignedFilter) &&
      filterByDate(task.date)
    );
  });

  return (
    <div className="overflow-x-auto px-4 pt-16 md:pl-10 md:pr-4 w-full">
      <div className="border-[0.5px] border-[#D1D1D1] rounded-xl min-h-40 min-w-fit">
        <table className="lg:text-sm text-xs mb-8 w-full">
          <thead>
            <tr className="text-[#222222] border-b-[1px] border-[#D6D8DB]">
              <th className="md:py-5 py-2 lg:px-12 px-4 w-1/5  text-center">Title</th>
              <th className="md:py-5 py-2 lg:px-12 px-4 w-1/5  text-center">Address</th>
              <th className="md:py-5 py-2 lg:px-4 xl:px-12 px-4 w-1/5  text-center">
                <select className="bg-white cursor-pointer w-24 text-center focus:outline-none" value={urgencyFilter} onChange={(e) => setUrgencyFilter(e.target.value)}>
                  <option value="All">Urgency</option>
                  <option value="Normal">Normal</option>
                  <option value="Urgent">Urgent</option>
                  <option value="All" className="text-red-600">Clear Filter</option>
                </select>
              </th>
              <th className="md:py-5 py-2 lg:px-12 px-4 w-1/5  text-center">
                <select className="bg-white cursor-pointer w-24 text-center focus:outline-none" value={assignedFilter} onChange={(e) => setAssignedFilter(e.target.value)}>
                  <option value="All">Assigned</option>
                  {Array.from(new Set(tasks?.map((task) => task.assigned))).map((assignee, index) => (
                    <option key={index} value={assignee}>{assignee}</option>
                  ))}
                  <option value="All" className="text-red-600">Clear Filter</option>
                </select>
              </th>
              <th className="md:py-5 py-2 lg:px-0 px-4 w-1/5 max-lg:w-1/5 text-center">
                <select className="bg-white cursor-pointer w-24 text-center focus:outline-none" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
                  <option value="All">Date</option>
                  <option value="Today">Today</option>
                  <option value="Yesterday">Yesterday</option>
                  <option value="Last 7 Days">Last 7 Days</option>
                  <option value="Last Month">Last Month</option>
                  <option value="All" className="text-red-600">Clear Filter</option>
                </select>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task, index) => (
                <tr key={index} className="md:py-5 lg:p-1 border-b-[1px] border-[#D1D1D1] cursor-pointer text-sm hover:bg-gray-50 active:bg-gray-100" onClick={() => handleClick(task.id)}>
                  <td className="text-center px-2 w-1/5">
                    <span>{task?.title}</span>
                  </td>
                  <td className="text-center px-3 w-1/5 ">{task?.address}</td>
                  <td className="text-center w-1/6  ">
                    <span className={`px-3 py-1 rounded-3xl ${task.urgency === "Normal" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                      {task.urgency}
                    </span>
                  </td>
                  <td className="md:py-2 p-1 text-center px-3 w-1/5 ">{task.assigned}</td>
                  <td className="md:py-2 p-1 text-center text-nowrap px-3 w-1/5 ">{task.date}</td>
                </tr>
              ))
            ) : (
              <>
                <tr >
                  <td colSpan={5}  className="py-4 text-center text-xl text-gray-500 max-sm:col-span-1">No tasks available</td>
                </tr>
                <tr className="invisible lg:hidden">
                  <td className="md:py-5 py-2 lg:px-12 px-4 text-center w-1/5 ">-</td>
                  <td className="md:py-5 py-2 lg:px-12 px-4 text-center w-1/5 ">-</td>
                  <td className="md:py-5 py-2 lg:px-12 px-4 text-center w-1/5 ">-</td>
                  <td className="md:py-5 py-2 lg:px-12 px-4 text-center w-1/5 ">-</td>
                  <td className="md:py-5 py-2 lg:px-12 px-4 text-center w-1/5 ">-</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Tasks;