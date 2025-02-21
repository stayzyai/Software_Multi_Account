import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";
import api from "@/api/api";
import { IoMdClose } from "react-icons/io";
import { setItem, getItem } from "../../../helpers/localstorage";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { setHostawayModal } from "../../../store/sidebarSlice";
import { useSelector, useDispatch } from "react-redux";

const HostawayConnectModal = () => {
  const [formFields, setFormFields] = useState({
    account_id: "",
    secret_id: "",
  });
  const ishostawayAccount = useSelector((state) => state.sidebar.isHostawayModel);
  const [isLoading, setIsLoading] = useState(false);
  // const [isOpen, SethostawayModal] = useState(true);
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    const checkHostawayAccount = () => {
      const account = getItem("isHostwayAccount");
      const msg = getItem("hostawayMessage");
      if (account) {
        dispatch(setHostawayModal(false));
      } else {
        dispatch(setHostawayModal(true))
        const errorMessage =
          msg === "hostaway token expired"
            ? "Hostaway token expired. Please reauthenticate your Hostaway account."
            : "Hostaway account does not exist. Please add your Hostaway account.";
        toast.error(errorMessage);
      }
    };
    setTimeout(() => {
      checkHostawayAccount();
    }, 1000);
  }, [location.pathname]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormFields((prevState) => ({ ...prevState, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.post("hostaway/authentication", formFields);
      if (response.status === 200) {
        toast.success("Hostaway account connected successfully!");
        setItem("isHostwayAccount", true);
        dispatch(setHostawayModal(false))
      }
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error("Error submit data:", error);
      if (error?.response?.data?.detail?.message) {
        toast.error(error?.response?.data?.detail?.message);
        return
      }
      toast.error("Some error occurred. Please try again");
    }
  };

  if (!ishostawayAccount) {
    return null;
  }
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-[500px] p-6 md:ml-52 mx-2 md:mx-0">
        <div className="flex justify-end">
          <span
            className="cursor-pointer font-bold active:bg-gray-50 hover:bg-opacity-50 p-1.5 rounded hover:bg-gray-50"
            onClick={() => dispatch(setHostawayModal(false))}
          >
            <IoMdClose size={18} />
          </span>
        </div>
        <div className="flex justify-between items-center">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 px-2 md:px-10 w-full pb-6"
          >
            <span className="text-md md:text-lg text-black font-semibold text-center">
              Enter Hostaway Credential
            </span>
            <div className="md:flex items-center gap-4 pt-8">
              <Label htmlFor="account_id" className="text-nowrap font-medium">
                Account Id
              </Label>
              <Input
                value={formFields.account_id}
                onChange={(e) => handleInputChange(e)}
                id="account_id"
                type="text"
                placeholder="Enter your hostaway account Id"
              />
            </div>
            <div className="md:flex items-center gap-4 pb-6">
              <Label
                htmlFor="secret_id"
                className="text-nowrap font-medium mr-3"
              >
                Secret Id
              </Label>
              <Input
                id="secret_id"
                type="text"
                placeholder="Enter your hostaway secret Id"
                value={formFields.secret_id}
                onChange={(e) => handleInputChange(e)}
              />
            </div>
            <Button className="w-full bg-green-800 hover:bg-green-700">
              {isLoading ? "connecting..." : "connect"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HostawayConnectModal;
