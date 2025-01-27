import React from "react";
import { useState, useEffect } from "react";
import api from "@/api/api";
import { toast } from "sonner";
import Header from "../Header";
import { AlertCircle, Trash2, Plus } from "lucide-react";
import { removeItem } from "../../../../helpers/localstorage";
import SettingShimmer from "../../../common/shimmer/settingShimmer";

const HostawayAccount = ({ setOpenModal }) => {
  const [hostawayAccount, setHostawayAccount] = useState({
    account_id: "",
    secret_id: "",
  });
  const [openPopup, setOpenPopup] = useState(false);
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getAccount = async () => {
      try {
        const response = await api.get("/hostaway/get-hostaway-account");
        if (response?.data?.detail?.data) {
          const { account_id, secret_id } = response.data.detail.data;
          setHostawayAccount({ account_id, secret_id });
        } else {
          setHostawayAccount({ account_id: "", secret_id: "" });
        }
      } catch (error) {
        console.log("Some error occred at get hostaway account", error);
        setHostawayAccount({ account_id: "", secret_id: "" });
      }
      setLoading(false)
    };
    getAccount();
  }, []);

  const handleDeleteAccount = async () => {
    setOpenPopup(false)
    try{
      const response = await api.delete("/hostaway/remove-authentication");
      if (response?.data?.detail?.message) {
        setHostawayAccount({ account_id: "", secret_id: "" });
        toast.success(response?.data?.detail?.message)
        removeItem("isHostwayAccount")
      }
    }catch(error){
      console.log("Some error occred at delete hostaway account", error)
      toast.error("Some error occured. Please try again")
    }
  };

 
  return (
    <>
      {!loading ? <div className="bg-[#FCFDFC] dark:bg-gray-900 flex pt-32 justify-center p-7">
        <div className="w-full bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200">
          <div className="p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              Hostaway account
            </h2>
            {hostawayAccount.account_id !== "" &&
            hostawayAccount.secret_id !== "" ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="font-semibold text-sm text-gray-600 dark:text-gray-400">
                    Account ID
                  </span>
                  <span className="md:text-md text-sm text-gray-800 dark:text-gray-200">
                    {hostawayAccount.account_id}
                  </span>
                </div>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="font-semibold text-sm text-gray-600 dark:text-gray-400 text-nowrap">
                    Secret ID
                  </span>
                  <span className="md:text-base text-sm text-gray-800 dark:text-gray-200 break-words">
                    {hostawayAccount.secret_id}
                  </span>
                </div>
                <button
                  onClick={() => setOpenPopup(true)}
                  // onClick={handleDeleteAccount}
                  className="w-full border border-red-600 sm:w-auto mt-6 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition duration-300 ease-in-out flex items-center justify-center"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove account
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center space-x-2 text-yellow-600 dark:text-yellow-500">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-sm">
                    Hostaway account not found. Please add your Hostaway
                    account.
                  </p>
                </div>
                <button
                  onClick={() => setOpenModal(true)}
                  className="w-full sm:w-auto mt-4 px-4 py-1.5 bg-green-800 border-green-600 hover:bg-green-700 text-white font-semibold rounded-md transition duration-300 ease-in-out flex items-center justify-center"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add account
                </button>
              </div>
            )}
          </div>
        </div>
      </div>:<SettingShimmer/>}
      {openPopup && (
        <div class="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center lg:justify-center justify-center md:justify-end md:pr-24 lg:pl-44">
          <div class="bg-white rounded-xl shadow-lg p-6 w-96">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">
              Are you sure you want to disconnect your Hostaway account?
            </h2>
            <div class="flex justify-end space-x-4">
              <button
                onClick={() => setOpenPopup(false)}
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                No
              </button>
              <button
                onClick={handleDeleteAccount}
                class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HostawayAccount;
