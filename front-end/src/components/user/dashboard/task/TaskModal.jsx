import { X, Calendar, MapPin, Clock, AlertCircle, User } from "lucide-react";

const TaskModal = ({ task, onClose, onViewFullTask }) => {
  if (!task) return null;

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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1:
        return 'bg-red-100 text-red-800 border-red-200';
      case 2:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'inProgress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'inProgress':
        return 'In Progress';
      case 'pending':
        return 'Pending';
      case 'completed':
        return 'Completed';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Task Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Title */}
          <div>
            <h4 className="text-lg font-medium text-gray-800 mb-2">{task.title}</h4>
            <p className="text-sm text-gray-600">Task ID: #{task.id}</p>
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Description</h5>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                {task.description}
              </p>
            </div>
          )}

          {/* Address */}
          {task.address && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <h5 className="text-sm font-medium text-gray-700">Address</h5>
                <p className="text-sm text-gray-600">{task.address}</p>
              </div>
            </div>
          )}

          {/* Created Date */}
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <h5 className="text-sm font-medium text-gray-700">Date Created</h5>
              <p className="text-sm text-gray-600">{formatDate(task.canStartFrom)}</p>
            </div>
          </div>

          {/* Priority and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Priority</h5>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                <AlertCircle className="w-3 h-3 mr-1" />
                {getPriorityText(task.priority)}
              </span>
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Status</h5>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                <Clock className="w-3 h-3 mr-1" />
                {getStatusText(task.status)}
              </span>
            </div>
          </div>

          {/* Assigned To */}
          {task.assigneeUserId && (
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <h5 className="text-sm font-medium text-gray-700">Assigned To</h5>
                <p className="text-sm text-gray-600">User ID: {task.assigneeUserId}</p>
              </div>
            </div>
          )}

          {/* Additional Info */}
          {task.reservationId && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-1">Reservation ID</h5>
              <p className="text-sm text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded">
                {task.reservationId}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Close
          </button>
          <button
            onClick={onViewFullTask}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Full Task
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;

