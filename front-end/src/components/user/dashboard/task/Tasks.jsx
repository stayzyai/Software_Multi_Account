import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { updateTask } from "../../../../helpers/Message";
import { toast } from "react-hot-toast";

const Tasks = ({ tasks, showCompleted = false, onTasksUpdate }) => {
  const navigate = useNavigate();
  const [urgencyFilter, setUrgencyFilter] = useState("All");
  const [assignedFilter, setAssignedFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);

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

  const filteredTasks = useMemo(() => {
    return tasks?.filter((task) => {
      return (
        (urgencyFilter === "All" || task.urgency === urgencyFilter) &&
        (assignedFilter === "All" || task.assigned === assignedFilter) &&
        filterByDate(task.date)
      );
    });
  }, [tasks, urgencyFilter, assignedFilter, dateFilter]);

  const handleClick = (id, event) => {
    // Don't navigate if clicking on checkbox
    if (event.target.type === 'checkbox') return;
    navigate(`/user/task/${id}`);
  };

  const handleSelectTask = (taskId, checked) => {
    const newSelected = new Set(selectedTasks);
    if (checked) {
      newSelected.add(taskId);
    } else {
      newSelected.delete(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const allTaskIds = new Set(filteredTasks.map(task => task.id));
      setSelectedTasks(allTaskIds);
    } else {
      setSelectedTasks(new Set());
    }
  };

  const isAllSelected = filteredTasks.length > 0 && selectedTasks.size === filteredTasks.length;
  const isIndeterminate = selectedTasks.size > 0 && selectedTasks.size < filteredTasks.length;

  const handleBulkComplete = async () => {
    if (selectedTasks.size === 0) return;
    
    setIsLoading(true);
    const results = { success: 0, failed: 0 };
    
    try {
      for (const taskId of selectedTasks) {
        try {
          const response = await updateTask({ status: "completed" }, taskId);
          if (response) {
            results.success++;
          } else {
            results.failed++;
          }
        } catch (error) {
          console.error(`Failed to complete task ${taskId}:`, error);
          results.failed++;
        }
      }
      
      if (results.success > 0) {
        toast.success(`${results.success} task(s) marked as completed`);
        setSelectedTasks(new Set());
        onTasksUpdate && onTasksUpdate();
      }
      
      if (results.failed > 0) {
        toast.error(`${results.failed} task(s) failed to update`);
      }
    } catch (error) {
      toast.error("Error updating tasks");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTasks.size === 0) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedTasks.size} task(s)? This action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    setIsLoading(true);
    const results = { success: 0, failed: 0 };
    
    try {
      for (const taskId of selectedTasks) {
        try {
          // Note: We'll need to implement deleteTask function
          // const response = await deleteTask(taskId);
          // For now, let's just show a message
          toast.error("Delete functionality not yet implemented");
          return;
        } catch (error) {
          console.error(`Failed to delete task ${taskId}:`, error);
          results.failed++;
        }
      }
    } catch (error) {
      toast.error("Error deleting tasks");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="overflow-x-auto px-4 pt-16 md:pl-10 md:pr-4 w-full">
      <div className="border-[0.5px] border-[#D1D1D1] rounded-xl min-h-40 min-w-fit">
        {/* Bulk Actions Toolbar */}
        {selectedTasks.size > 0 && (
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-700">
                {selectedTasks.size} task{selectedTasks.size > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkComplete}
                  disabled={isLoading}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading ? "Processing..." : "Mark Complete"}
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={isLoading}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {isLoading ? "Processing..." : "Delete"}
                </button>
              </div>
            </div>
            <button
              onClick={() => setSelectedTasks(new Set())}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear Selection
            </button>
          </div>
        )}

        <table className="lg:text-sm text-xs mb-8 w-full">
          <thead>
            <tr className="text-[#222222] border-b-[1px] border-[#D6D8DB]">
              <th className="md:py-5 py-2 lg:px-4 px-2 w-12 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isIndeterminate;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
              </th>
              <th className="md:py-5 py-2 lg:px-12 px-4 w-1/5 text-center">Title</th>
              <th className="md:py-5 py-2 lg:px-12 px-4 w-1/5 text-center">Address</th>
              <th className="md:py-5 py-2 lg:px-4 xl:px-12 px-4 w-1/5 text-center">
                <select className="bg-white cursor-pointer w-24 text-center focus:outline-none" value={urgencyFilter} onChange={(e) => setUrgencyFilter(e.target.value)}>
                  <option value="All">Urgency</option>
                  <option value="Normal">Normal</option>
                  <option value="Urgent">Urgent</option>
                  <option value="All" className="text-red-600">Clear Filter</option>
                </select>
              </th>
              <th className="md:py-5 py-2 lg:px-12 px-4 w-1/5 text-center">
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
                <tr 
                  key={index} 
                  className={`md:py-5 lg:p-1 border-b-[1px] border-[#D1D1D1] cursor-pointer text-sm hover:bg-gray-50 active:bg-gray-100 ${
                    selectedTasks.has(task.id) ? 'bg-blue-50' : ''
                  }`} 
                  onClick={(e) => handleClick(task.id, e)}
                >
                  <td className="text-center px-2 w-12">
                    <input
                      type="checkbox"
                      checked={selectedTasks.has(task.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleSelectTask(task.id, e.target.checked);
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </td>
                  <td className="text-center px-2 w-1/5">
                    <span>{task?.title}</span>
                  </td>
                  <td className="text-center px-3 w-1/5 py-2">{task?.address}</td>
                  <td className="text-center w-1/6">
                    <span className={`px-3 py-1 rounded-3xl ${task.urgency === "Normal" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                      {task.urgency}
                    </span>
                  </td>
                  <td className="md:py-2 p-1 text-center px-3 w-1/5">{task.assigned}</td>
                  <td className="md:py-2 p-1 text-center text-nowrap px-3 w-1/5">{task.date}</td>
                </tr>
              ))
            ) : (
              <>
                <tr>
                  <td colSpan={6} className="py-4 text-center text-xl text-gray-500 max-sm:col-span-1">No tasks available</td>
                </tr>
                <tr className="invisible lg:hidden">
                  <td className="md:py-5 py-2 lg:px-4 px-2 text-center w-12">-</td>
                  <td className="md:py-5 py-2 lg:px-12 px-4 text-center w-1/5">-</td>
                  <td className="md:py-5 py-2 lg:px-12 px-4 text-center w-1/5">-</td>
                  <td className="md:py-5 py-2 lg:px-12 px-4 text-center w-1/5">-</td>
                  <td className="md:py-5 py-2 lg:px-12 px-4 text-center w-1/5">-</td>
                  <td className="md:py-5 py-2 lg:px-12 px-4 text-center w-1/5">-</td>
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