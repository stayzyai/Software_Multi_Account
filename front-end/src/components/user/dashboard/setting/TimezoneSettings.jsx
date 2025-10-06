import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateUserTimezone } from "../../../../store/userSlice";
import { notifyTimezoneChange } from "../../../../helpers/Message";
import { toast } from "sonner";
import { Clock } from "lucide-react";

const TimezoneSettings = () => {
  const dispatch = useDispatch();
  const userProfile = useSelector((state) => state.user);
  const [selectedTimezone, setSelectedTimezone] = useState(userProfile.timezone || "America/Chicago");
  const [loading, setLoading] = useState(false);

  // Initialize timezone from Redux store
  useEffect(() => {
    const userTimezone = userProfile.timezone || "America/Chicago";
    setSelectedTimezone(userTimezone);
  }, [userProfile.timezone]);

  // Comprehensive list of world timezones
  const timezones = [
    // North America
    { value: "America/New_York", label: "Eastern Time (New York)", region: "North America" },
    { value: "America/Chicago", label: "Central Time (Chicago)", region: "North America" },
    { value: "America/Denver", label: "Mountain Time (Denver)", region: "North America" },
    { value: "America/Los_Angeles", label: "Pacific Time (Los Angeles)", region: "North America" },
    { value: "America/Phoenix", label: "Mountain Standard Time (Phoenix)", region: "North America" },
    { value: "America/Anchorage", label: "Alaska Time (Anchorage)", region: "North America" },
    { value: "Pacific/Honolulu", label: "Hawaii Time (Honolulu)", region: "North America" },
    { value: "America/Toronto", label: "Eastern Time (Toronto)", region: "North America" },
    { value: "America/Vancouver", label: "Pacific Time (Vancouver)", region: "North America" },
    
    // Europe
    { value: "Europe/London", label: "Greenwich Mean Time (London)", region: "Europe" },
    { value: "Europe/Paris", label: "Central European Time (Paris)", region: "Europe" },
    { value: "Europe/Berlin", label: "Central European Time (Berlin)", region: "Europe" },
    { value: "Europe/Rome", label: "Central European Time (Rome)", region: "Europe" },
    { value: "Europe/Madrid", label: "Central European Time (Madrid)", region: "Europe" },
    { value: "Europe/Amsterdam", label: "Central European Time (Amsterdam)", region: "Europe" },
    { value: "Europe/Brussels", label: "Central European Time (Brussels)", region: "Europe" },
    { value: "Europe/Zurich", label: "Central European Time (Zurich)", region: "Europe" },
    { value: "Europe/Vienna", label: "Central European Time (Vienna)", region: "Europe" },
    { value: "Europe/Stockholm", label: "Central European Time (Stockholm)", region: "Europe" },
    { value: "Europe/Oslo", label: "Central European Time (Oslo)", region: "Europe" },
    { value: "Europe/Copenhagen", label: "Central European Time (Copenhagen)", region: "Europe" },
    { value: "Europe/Helsinki", label: "Eastern European Time (Helsinki)", region: "Europe" },
    { value: "Europe/Athens", label: "Eastern European Time (Athens)", region: "Europe" },
    { value: "Europe/Istanbul", label: "Turkey Time (Istanbul)", region: "Europe" },
    { value: "Europe/Moscow", label: "Moscow Standard Time (Moscow)", region: "Europe" },
    
    // Asia
    { value: "Asia/Dubai", label: "Gulf Standard Time (Dubai)", region: "Asia" },
    { value: "Asia/Kolkata", label: "India Standard Time (Mumbai)", region: "Asia" },
    { value: "Asia/Bangkok", label: "Indochina Time (Bangkok)", region: "Asia" },
    { value: "Asia/Singapore", label: "Singapore Standard Time (Singapore)", region: "Asia" },
    { value: "Asia/Hong_Kong", label: "Hong Kong Time (Hong Kong)", region: "Asia" },
    { value: "Asia/Shanghai", label: "China Standard Time (Shanghai)", region: "Asia" },
    { value: "Asia/Tokyo", label: "Japan Standard Time (Tokyo)", region: "Asia" },
    { value: "Asia/Seoul", label: "Korea Standard Time (Seoul)", region: "Asia" },
    { value: "Asia/Jakarta", label: "Western Indonesia Time (Jakarta)", region: "Asia" },
    { value: "Asia/Manila", label: "Philippine Standard Time (Manila)", region: "Asia" },
    { value: "Asia/Kuala_Lumpur", label: "Malaysia Time (Kuala Lumpur)", region: "Asia" },
    { value: "Asia/Taipei", label: "Taipei Standard Time (Taipei)", region: "Asia" },
    
    // Australia & Oceania
    { value: "Australia/Sydney", label: "Australian Eastern Time (Sydney)", region: "Australia & Oceania" },
    { value: "Australia/Melbourne", label: "Australian Eastern Time (Melbourne)", region: "Australia & Oceania" },
    { value: "Australia/Brisbane", label: "Australian Eastern Time (Brisbane)", region: "Australia & Oceania" },
    { value: "Australia/Perth", label: "Australian Western Time (Perth)", region: "Australia & Oceania" },
    { value: "Australia/Adelaide", label: "Australian Central Time (Adelaide)", region: "Australia & Oceania" },
    { value: "Pacific/Auckland", label: "New Zealand Standard Time (Auckland)", region: "Australia & Oceania" },
    { value: "Pacific/Fiji", label: "Fiji Time (Suva)", region: "Australia & Oceania" },
    
    // South America
    { value: "America/Sao_Paulo", label: "Brasilia Time (São Paulo)", region: "South America" },
    { value: "America/Argentina/Buenos_Aires", label: "Argentina Time (Buenos Aires)", region: "South America" },
    { value: "America/Santiago", label: "Chile Time (Santiago)", region: "South America" },
    { value: "America/Lima", label: "Peru Time (Lima)", region: "South America" },
    { value: "America/Bogota", label: "Colombia Time (Bogotá)", region: "South America" },
    { value: "America/Caracas", label: "Venezuela Time (Caracas)", region: "South America" },
    
    // Africa
    { value: "Africa/Cairo", label: "Eastern European Time (Cairo)", region: "Africa" },
    { value: "Africa/Johannesburg", label: "South Africa Standard Time (Johannesburg)", region: "Africa" },
    { value: "Africa/Lagos", label: "West Africa Time (Lagos)", region: "Africa" },
    { value: "Africa/Nairobi", label: "East Africa Time (Nairobi)", region: "Africa" },
    { value: "Africa/Casablanca", label: "Western European Time (Casablanca)", region: "Africa" },
    
    // Middle East
    { value: "Asia/Jerusalem", label: "Israel Standard Time (Jerusalem)", region: "Middle East" },
    { value: "Asia/Riyadh", label: "Arabia Standard Time (Riyadh)", region: "Middle East" },
    { value: "Asia/Tehran", label: "Iran Standard Time (Tehran)", region: "Middle East" },
  ];

  // Group timezones by region
  const groupedTimezones = timezones.reduce((groups, timezone) => {
    const region = timezone.region;
    if (!groups[region]) {
      groups[region] = [];
    }
    groups[region].push(timezone);
    return groups;
  }, {});

  const handleTimezoneChange = (timezone) => {
    setSelectedTimezone(timezone);
    setLoading(true);
    
    // Update Redux store - this is the single source of truth
    dispatch(updateUserTimezone(timezone));
    
    // Notify all components that timezone has changed
    notifyTimezoneChange();
    
    // Show success message
    toast.success(`Timezone updated to ${timezones.find(tz => tz.value === timezone)?.label}`);
    
    setLoading(false);
  };

  const getCurrentTime = (timezone) => {
    try {
      return new Date().toLocaleTimeString('en-US', {
        timeZone: timezone,
        hour12: true,
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return "Invalid timezone";
    }
  };

  return (
    <div className="bg-[#FCFDFC] dark:bg-gray-900 flex justify-center p-7">
      <div className="w-full bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200">
        <div className="p-6 sm:p-8">
          <div className="flex items-center mb-6">
            <Clock className="h-6 w-6 text-gray-600 dark:text-gray-400 mr-3" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Timezone Settings
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Set your preferred timezone for displaying dates and times throughout the application
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Current Timezone Display */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-1">
                    Current Timezone
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {timezones.find(tz => tz.value === selectedTimezone)?.label || selectedTimezone}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Current Time</p>
                  <p className="text-xl font-semibold text-gray-800 dark:text-white">
                    {getCurrentTime(selectedTimezone)}
                  </p>
                </div>
              </div>
            </div>

            {/* Timezone Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                Select Timezone
              </label>
              <select
                value={selectedTimezone}
                onChange={(e) => handleTimezoneChange(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
              >
                {Object.entries(groupedTimezones).map(([region, timezones]) => (
                  <optgroup key={region} label={region}>
                    {timezones.map((timezone) => (
                      <option key={timezone.value} value={timezone.value}>
                        {timezone.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Helper Text */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Clock className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Timezone Information
                  </h3>
                  <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                    <p>
                      • All dates and times in messages, bookings, and reports will be displayed in your selected timezone
                    </p>
                    <p>
                      • Your timezone setting is saved automatically and will persist across sessions
                    </p>
                    <p>
                      • You can change your timezone at any time from this settings page
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimezoneSettings;
