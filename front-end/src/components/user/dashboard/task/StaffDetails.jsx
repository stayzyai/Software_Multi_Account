import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Phone, Mail, User, Calendar, Clock, AlertCircle } from "lucide-react";
import Header from "../Header";
import TaskModal from "./TaskModal";
import api from "../../../../api/api";

const StaffDetails = () => {
  const navigate = useNavigate();
  const { staffId } = useParams();
  const [staff, setStaff] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const fetchStaffDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch staff member details
      const staffResponse = await api.get("/hostaway/get-all/users");
      if (staffResponse?.data?.detail?.data?.status === 'success') {
        const users = staffResponse.data.detail.data.result || [];
        const staffMember = users.find(user => user.id == staffId && user.readTask === 1);
        if (staffMember) {
          setStaff(staffMember);
        } else {
          setError("Staff member not found");
          return;
        }
      }

      // Fetch tasks for this staff member
      const tasksResponse = await api.get("/hostaway/get-all/tasks");
      if (tasksResponse?.data?.detail?.data?.status === 'success') {
        const allTasks = tasksResponse.data.detail.data.result || [];
        const staffTasks = allTasks.filter(task => task.assigneeUserId == staffId);
        setTasks(staffTasks);
      }
    } catch (err) {
      setError("Error loading staff details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (staffId) {
      fetchStaffDetails();
    }
  }, [staffId]);

  const getTaskStatus = (status) => {
    switch (status) {
      case 'inProgress':
        return { text: 'In Progress', color: 'bg-blue-100 text-blue-800' };
      case 'pending':
        return { text: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
      case 'completed':
        return { text: 'Completed', color: 'bg-green-100 text-green-800' };
      default:
        return { text: 'Unknown', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1:
        return 'bg-red-100 text-red-800';
      case 2:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 1:
        return 'High';
      case 2:
        return 'Medium';
      default:
        return 'Low';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleCloseModal = () => {
    setShowTaskModal(false);
    setSelectedTask(null);
  };

  if (loading) {
    return (
      <>
        <div className="pt-[74px]">
          <Header title="Staff Details" />
          <div className="px-4 pt-4 md:pl-10 md:pr-4 p-10">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !staff) {
    return (
      <>
        <div className="pt-[74px]">
          <Header title="Staff Details" />
          <div className="px-4 pt-4 md:pl-10 md:pr-4 p-10 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error || "Staff member not found"}</p>
            <button 
              onClick={() => navigate('/user/tasks/staff')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Back to Staff List
            </button>
          </div>
        </div>
      </>
    );
  }

  const taskStats = {
    total: tasks.length,
    inProgress: tasks.filter(task => task.status === 'inProgress').length,
    completed: tasks.filter(task => task.status === 'completed').length,
    pending: tasks.filter(task => task.status === 'pending').length,
  };

  return (
    <>
      <div className="pt-[74px]">
        <Header title="Staff Details" />
        
        {/* Back Button */}
        <div className="px-4 pt-4">
          <button
            onClick={() => navigate('/user/tasks/staff')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Staff List
          </button>
        </div>

        <div className="px-4 pt-4 md:pl-10 md:pr-4">
        {/* Staff Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">
                  {staff.firstName} {staff.lastName}
                </h2>
                <p className="text-gray-600">Staff Member</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Total Tasks</div>
              <div className="text-3xl font-bold text-blue-600">{taskStats.total}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-gray-800">{staff.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-800">{staff.email || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Emergency Contact</p>
                    <p className="text-gray-800">{staff.emergencyContact || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Task Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">In Progress</span>
                  <span className="font-semibold text-blue-600">{taskStats.inProgress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending</span>
                  <span className="font-semibold text-yellow-600">{taskStats.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed</span>
                  <span className="font-semibold text-green-600">{taskStats.completed}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Performance</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Completion Rate</span>
                  <span className="font-semibold">
                    {taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Tasks</span>
                  <span className="font-semibold">{taskStats.inProgress + taskStats.pending}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-6">Assigned Tasks</h3>
          
          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No tasks assigned to this staff member</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.map((task) => {
                const status = getTaskStatus(task.status);
                const priority = getPriorityColor(task.priority);
                const priorityText = getPriorityText(task.priority);

                return (
                  <div
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-gray-800 line-clamp-2">{task.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.text}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(task.canStartFrom)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs ${priority}`}>
                          {priorityText} Priority
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </div>

        {/* Task Modal */}
        {showTaskModal && selectedTask && (
          <TaskModal
            task={selectedTask}
            onClose={handleCloseModal}
            onViewFullTask={() => {
              handleCloseModal();
              navigate(`/user/task/${selectedTask.id}`);
            }}
          />
        )}
      </div>
    </>
  );
};

export default StaffDetails;
