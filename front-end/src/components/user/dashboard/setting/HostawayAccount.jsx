import React from "react";
import { useState, useEffect } from "react";
import api from "@/api/api";
import { toast } from "sonner";
import { AlertCircle, Trash2, Plus, Edit2, Star, StarOff } from "lucide-react";
import { removeItem } from "../../../../helpers/localstorage";
import SettingShimmer from "../../../common/shimmer/settingShimmer";
import { setHostawayModal } from "../../../../store/sidebarSlice";
import { setHostawayAccounts, setPrimaryAccount, removeHostawayAccount, updateHostawayAccount } from "../../../../store/hostawayUserSlice";
import { useDispatch, useSelector } from "react-redux";

const HostawayAccount = ({ setOpenModal }) => {
  const [openPopup, setOpenPopup] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [editingAccount, setEditingAccount] = useState(null);
  const [newAccountName, setNewAccountName] = useState("");
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const hostawayAccounts = useSelector((state) => state.hostawayUser.accounts);

  useEffect(() => {
    const getAccounts = async () => {
      try {
        const response = await api.get("/hostaway/get-hostaway-accounts");
        if (response?.data?.detail?.accounts) {
          dispatch(setHostawayAccounts(response.data.detail.accounts));
        } else {
          dispatch(setHostawayAccounts([]));
        }
      } catch (error) {
        dispatch(setHostawayAccounts([]));
      }
      setLoading(false);
    };
    getAccounts();
  }, [dispatch]);

  const handleDeleteAccount = async (accountId) => {
    setOpenPopup(false);
    try {
      const response = await api.delete(`/hostaway/remove-account/${accountId}`);
      if (response?.data?.detail?.message) {
        dispatch(removeHostawayAccount(accountId));
        toast.success(response?.data?.detail?.message);
        if (hostawayAccounts.length === 1) {
          removeItem("isHostwayAccount");
        }
      }
    } catch (error) {
      toast.error("Some error occurred. Please try again");
    }
  };

  const handleSetPrimary = async (accountId) => {
    const account = hostawayAccounts.find(acc => acc.id === accountId);
    if (!account) return;
    
    if (window.confirm(`Are you sure you want to set "${account.account_name || 'this account'}" as your primary Hostaway account?`)) {
      try {
        const response = await api.put(`/hostaway/set-primary/${accountId}`);
        if (response?.data?.detail?.message) {
          dispatch(setPrimaryAccount(accountId));
          // Update all accounts to reflect the new primary status
          hostawayAccounts.forEach(account => {
            dispatch(updateHostawayAccount({
              id: account.id,
              updates: { is_primary: account.id === accountId }
            }));
          });
          toast.success(response?.data?.detail?.message);
        }
      } catch (error) {
        toast.error("Some error occurred. Please try again");
      }
    }
  };

  const handleRenameAccount = async (accountId, newName) => {
    if (!newName.trim()) {
      toast.error("Account name cannot be empty");
      return;
    }
    
    try {
      const response = await api.put(`/hostaway/rename-account/${accountId}?new_name=${encodeURIComponent(newName.trim())}`);
      if (response?.data?.detail?.message) {
        dispatch(updateHostawayAccount({
          id: accountId,
          updates: { account_name: newName.trim() }
        }));
        setEditingAccount(null);
        setNewAccountName("");
        toast.success(response?.data?.detail?.message);
      }
    } catch (error) {
      toast.error("Some error occurred. Please try again");
    }
  };

  const startEditing = (account) => {
    setEditingAccount(account);
    setNewAccountName(account.account_name || "");
  };

  const cancelEditing = () => {
    setEditingAccount(null);
    setNewAccountName("");
  };

  return (
    <>
      {!loading ? (
        <div className="bg-[#FCFDFC] dark:bg-gray-900 flex justify-center p-7">
          <div className="w-full bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200">
            <div className="p-6 sm:p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Hostaway Accounts
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Manage up to 3 Hostaway accounts. The primary account is used for data synchronization.
                  </p>
                </div>
                {hostawayAccounts.length < 3 && (
                  <button
                    onClick={() => dispatch(setHostawayModal(true))}
                    className="px-4 py-2 bg-green-800 hover:bg-green-700 text-white font-semibold rounded-md transition duration-300 ease-in-out flex items-center"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Account ({hostawayAccounts.length}/3)
                  </button>
                )}
                {hostawayAccounts.length >= 3 && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Maximum accounts reached (3/3)
                  </span>
                )}
              </div>
              
              {hostawayAccounts.length > 0 ? (
                <div className="space-y-4">
                  {hostawayAccounts.map((account, index) => (
                    <div key={account.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                            {editingAccount?.id === account.id ? (
                              <input
                                type="text"
                                value={newAccountName}
                                onChange={(e) => setNewAccountName(e.target.value)}
                                className="bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded px-2 py-1 text-gray-800 dark:text-white"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleRenameAccount(account.id, newAccountName);
                                  }
                                }}
                                autoFocus
                              />
                            ) : (
                              account.account_name || `Account ${index + 1}`
                            )}
                          </h3>
                          {account.is_primary && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                              <Star className="w-3 h-3 mr-1" />
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          {editingAccount?.id === account.id ? (
                            <>
                              <button
                                onClick={() => handleRenameAccount(account.id, newAccountName)}
                                className="p-1 text-green-600 hover:text-green-800"
                                title="Save"
                              >
                                ✓
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="p-1 text-gray-600 hover:text-gray-800"
                                title="Cancel"
                              >
                                ✕
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEditing(account)}
                                className="p-1 text-blue-600 hover:text-blue-800"
                                title="Rename"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              {!account.is_primary && (
                                <button
                                  onClick={() => handleSetPrimary(account.id)}
                                  className="p-1 text-yellow-600 hover:text-yellow-800"
                                  title="Set as Primary Account"
                                >
                                  <StarOff className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setAccountToDelete(account);
                                  setOpenPopup(true);
                                }}
                                className="p-1 text-red-600 hover:text-red-800"
                                title={hostawayAccounts.length === 1 ? "Remove (This is your last account)" : "Remove Account"}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-semibold text-gray-600 dark:text-gray-400">Account ID:</span>
                          <span className="ml-2 text-gray-800 dark:text-gray-200">
                            {account.account_id
                              ? "*".repeat(account.account_id.length - 4) + account.account_id.slice(-4)
                              : ""}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-600 dark:text-gray-400">Secret ID:</span>
                          <span className="ml-2 text-gray-800 dark:text-gray-200">
                            {account.secret_id
                              ? "*".repeat(account.secret_id.length - 4) + account.secret_id.slice(-4)
                              : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <div className="flex items-center space-x-2 text-yellow-600 dark:text-yellow-500">
                    <AlertCircle className="h-5 w-5" />
                    <p className="text-sm">
                      No Hostaway accounts found. Please add your first Hostaway account.
                    </p>
                  </div>
                  <button
                    onClick={() => dispatch(setHostawayModal(true))}
                    className="w-full sm:w-auto mt-4 px-4 py-1.5 bg-green-800 border-green-600 hover:bg-green-700 text-white font-semibold rounded-md transition duration-300 ease-in-out flex items-center justify-center"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Account
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <SettingShimmer />
      )}
      {openPopup && accountToDelete && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center lg:justify-center justify-center md:justify-end md:pr-24 lg:pl-44">
          <div className="bg-white rounded-xl shadow-lg p-6 w-96">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Are you sure you want to remove "{accountToDelete.account_name || 'this account'}"?
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              This action cannot be undone. The account will be removed from your settings.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setOpenPopup(false);
                  setAccountToDelete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteAccount(accountToDelete.id)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HostawayAccount;
