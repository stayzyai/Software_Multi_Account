import Header from "../Header";
import HostawayAccount from "./HostawayAccount";
import UserProfile from "./Userprofile";
import { useSelector, useDispatch } from "react-redux";
import { updateMasterAIStatus } from "../../../../store/userSlice";
import { toast } from "sonner";

const MainSetting = () => {
  const dispatch = useDispatch();
  const userProfile = useSelector((state) => state.user);

  const handleMasterAIToggle = () => {
    const newStatus = !userProfile.master_ai_enabled;
    dispatch(updateMasterAIStatus(newStatus));
    toast.success(
      newStatus 
        ? "AI features enabled globally" 
        : "AI features disabled globally"
    );
  };

  return (
    <>
      <Header title={"Settings"} role={"user"} />
      
      {/* AI Control Section - Same styling as other sections */}
      <div className="bg-[#FCFDFC] dark:bg-gray-900 flex pt-32 justify-center p-7">
        <div className="w-full bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200">
          <div className="p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              AI Control
            </h2>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Master AI Toggle
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Control all AI features across the entire application
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  When disabled, all AI features (chat AI, property AI, sentiment analysis) will be turned off
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`text-sm font-medium ${userProfile.master_ai_enabled ? 'text-green-600' : 'text-gray-400'}`}>
                  {userProfile.master_ai_enabled ? 'Enabled' : 'Disabled'}
                </span>
                <button
                  onClick={handleMasterAIToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    userProfile.master_ai_enabled ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      userProfile.master_ai_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hostaway Account - Separate section */}
      <HostawayAccount />
      
      {/* User Profile - Separate section */}
      <UserProfile />
    </>
  );
};

export default MainSetting;
