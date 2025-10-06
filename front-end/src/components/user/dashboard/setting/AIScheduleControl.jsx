import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  updateAIScheduleEnabled, 
  updateAIScheduleDay, 
  addAIScheduleDateRange, 
  removeAIScheduleDateRange,
  updateAIScheduleDateRange 
} from '../../../../store/userSlice';
import { toast } from 'sonner';

const AIScheduleControl = () => {
  const dispatch = useDispatch();
  const userProfile = useSelector((state) => state.user);
  const { ai_schedule } = userProfile;
  
  const [showDateRangeForm, setShowDateRangeForm] = useState(false);
  const [newDateRange, setNewDateRange] = useState({
    startDate: '',
    endDate: '',
    enabled: true
  });

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  const handleScheduleToggle = () => {
    const newStatus = !ai_schedule.enabled;
    dispatch(updateAIScheduleEnabled(newStatus));
    toast.success(
      newStatus 
        ? "AI Schedule control enabled" 
        : "AI Schedule control disabled"
    );
  };

  const handleDayToggle = (day) => {
    const currentDay = ai_schedule.days[day];
    dispatch(updateAIScheduleDay({ 
      day, 
      enabled: !currentDay.enabled 
    }));
  };

  const handleTimeChange = (day, timeType, value) => {
    dispatch(updateAIScheduleDay({ 
      day, 
      [timeType]: value 
    }));
  };

  const handleAddDateRange = () => {
    if (!newDateRange.startDate || !newDateRange.endDate) {
      toast.error("Please select both start and end dates");
      return;
    }
    
    if (new Date(newDateRange.startDate) > new Date(newDateRange.endDate)) {
      toast.error("Start date must be before end date");
      return;
    }

    dispatch(addAIScheduleDateRange(newDateRange));
    setNewDateRange({ startDate: '', endDate: '', enabled: true });
    setShowDateRangeForm(false);
    toast.success("Date range added successfully");
  };

  const handleRemoveDateRange = (index) => {
    dispatch(removeAIScheduleDateRange(index));
    toast.success("Date range removed");
  };

  const handleDateRangeToggle = (index) => {
    const currentRange = ai_schedule.dateRanges[index];
    dispatch(updateAIScheduleDateRange({ 
      index, 
      enabled: !currentRange.enabled 
    }));
  };

  const formatTime = (time) => {
    return time || "09:00";
  };

  return (
    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">
            AI Schedule Control
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Set specific times and dates when AI should be active
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            When enabled, AI will only respond during scheduled times
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`text-sm font-medium ${ai_schedule.enabled ? 'text-green-600' : 'text-gray-400'}`}>
            {ai_schedule.enabled ? 'Enabled' : 'Disabled'}
          </span>
          <button
            onClick={handleScheduleToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              ai_schedule.enabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                ai_schedule.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {ai_schedule.enabled && (
        <div className="space-y-6">
          {/* Weekly Schedule */}
          <div>
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-200 mb-3">
              Weekly Schedule
            </h4>
            <div className="space-y-3">
              {days.map((day) => {
                const dayData = ai_schedule.days[day.key];
                return (
                  <div key={day.key} className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3 min-w-[120px]">
                      <button
                        onClick={() => handleDayToggle(day.key)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          dayData.enabled ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            dayData.enabled ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">
                        {day.label}
                      </span>
                    </div>
                    
                    {dayData.enabled && (
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <label className="text-xs text-gray-500 dark:text-gray-400">From:</label>
                          <input
                            type="time"
                            value={formatTime(dayData.startTime)}
                            onChange={(e) => handleTimeChange(day.key, 'startTime', e.target.value)}
                            className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                          />
                        </div>
                        <div className="flex items-center space-x-1">
                          <label className="text-xs text-gray-500 dark:text-gray-400">To:</label>
                          <input
                            type="time"
                            value={formatTime(dayData.endTime)}
                            onChange={(e) => handleTimeChange(day.key, 'endTime', e.target.value)}
                            className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Date Ranges */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-md font-medium text-gray-700 dark:text-gray-200">
                Special Date Ranges
              </h4>
              <button
                onClick={() => setShowDateRangeForm(!showDateRangeForm)}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {showDateRangeForm ? 'Cancel' : '+ Add Date Range'}
              </button>
            </div>

            {showDateRangeForm && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={newDateRange.startDate}
                      onChange={(e) => setNewDateRange({ ...newDateRange, startDate: e.target.value })}
                      className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={newDateRange.endDate}
                      onChange={(e) => setNewDateRange({ ...newDateRange, endDate: e.target.value })}
                      className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleAddDateRange}
                      className="w-full bg-blue-600 text-white text-sm py-1 px-3 rounded hover:bg-blue-700 transition-colors"
                    >
                      Add Range
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {ai_schedule.dateRanges.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  No special date ranges configured
                </p>
              ) : (
                ai_schedule.dateRanges.map((range, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleDateRangeToggle(index)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          range.enabled ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            range.enabled ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className="text-sm text-gray-700 dark:text-gray-200">
                        {range.startDate} to {range.endDate}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveDateRange(index)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Current Status */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h5 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              Current AI Status
            </h5>
            <p className="text-xs text-blue-600 dark:text-blue-300">
              AI will be {ai_schedule.enabled ? 'active' : 'inactive'} based on your schedule settings.
              {ai_schedule.enabled && ' Check the weekly schedule and date ranges above for specific times.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIScheduleControl;
