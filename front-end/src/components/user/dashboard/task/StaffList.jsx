import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Phone, Mail } from "lucide-react";
import Header from "../Header";
import api from "../../../../api/api";

const StaffList = () => {
  const navigate = useNavigate();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await api.get("/hostaway/get-all/users");
      
      if (response?.data?.detail?.data?.status === 'success') {
        // Filter users with readTask permission
        const users = response.data.detail.data.result || [];
        const staffWithReadTask = users.filter(user => user.readTask === 1);
        setStaff(staffWithReadTask);
      } else {
        setError("Failed to fetch staff data");
      }
    } catch (err) {
      setError("Error loading staff data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const getTaskStatus = (staffId) => {
    // For now, return placeholder data
    // This will be replaced with actual task data later
    return {
      total: 0,
      inProgress: 0,
      completed: 0,
      pending: 0
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'inProgress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="pt-[74px]">
        <Header title="Staff Info" />
        <div className="p-10">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-[74px]">
        <Header title="Staff Info" />
        <div className="p-10 text-center">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchStaff}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="pt-[74px]">
        <Header title="Staff Info" />
        
        {/* Back Button */}
        <div className="px-4 pt-4">
          <button
            onClick={() => navigate('/user/tasks')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tasks
          </button>
        </div>

        <div className="px-4 pt-4 md:pl-10 md:pr-4">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Staff Members</h2>
          <p className="text-gray-600">Manage and view staff member information and task assignments</p>
        </div>

        {staff.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No Staff Members Found</h3>
            <p className="text-gray-500">No users with task permissions found in your Hostaway account.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staff.map((member) => {
              const taskStats = getTaskStatus(member.id);
              const status = taskStats.inProgress > 0 ? 'inProgress' : 
                           taskStats.pending > 0 ? 'pending' : 
                           taskStats.completed > 0 ? 'completed' : 'available';

              return (
                <div
                  key={member.id}
                  onClick={() => navigate(`/user/tasks/staff/${member.id}`)}
                  className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {member.firstName} {member.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">Staff Member</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                      {status === 'inProgress' ? 'In Progress' : 
                       status === 'pending' ? 'Pending' : 
                       status === 'completed' ? 'Completed' : 'Available'}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{member.phone || 'No phone'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{member.email || 'No email'}</span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{taskStats.total}</p>
                        <p className="text-xs text-gray-500">Total</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-yellow-600">{taskStats.inProgress}</p>
                        <p className="text-xs text-gray-500">In Progress</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">{taskStats.completed}</p>
                        <p className="text-xs text-gray-500">Completed</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </>
  );
};

export default StaffList;
