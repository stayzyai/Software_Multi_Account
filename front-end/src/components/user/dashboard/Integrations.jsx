import React from "react";
import { useEffect, useState } from "react";
import api from "@/api/api";
import { toast } from "sonner";
import Header from "./Header";
import { getItem } from "../../../helpers/localstorage";
import { ExternalLink } from "lucide-react";
import { FaRegCopy } from "react-icons/fa";
import HostawayAccount from "./setting/HostawayAccount";
import SettingShimmer from "../../common/shimmer/settingShimmer";

const Integrations = ({ toggleSidebar, setOpenModal}) => {
  const [extensionKey, setExtensionKey] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const [hostawayAccount, setHostawayAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const encrypt = import.meta.env.VITE_ENCRYPT_KEY;

  const handleCopy = () => {
    navigator.clipboard.writeText(extensionKey);
    toast.success("Key copied to clipboard");
  };

  useEffect(() => {
    const getKey = async () => {
      const response = await api.get(`/user/get-extension-key`);
      if (response?.data?.detail) {
        setExtensionKey(response?.data?.detail?.key);
      } else {
        setExtensionKey("");
      }
      setLoading(false);
    };
    getKey();
    setHostawayAccount(getItem("isHostwayAccount"));
  }, [extensionKey]);

  const handleGenrateKey = async () => {
    if (!hostawayAccount) {
      toast.error("Please add a hostaway account.");
      return;
    }
    const response = await api.get(`/user/genrate-extension-key`);
    if (response?.data?.detail) {
      setExtensionKey(response?.data?.detail?.key);
      toast.success("Key genrated successfully");
    } else {
      toast.error("Key genrated faild. Pleas try again");
      setExtensionKey("");
    }
  };

  if (isHovered) {
    toast.info("Click to copy to clipboard");
  }

  return (
    <>
      <Header
        title={"Integrations"}
        toggleSidebar={toggleSidebar}
        role={"user"}
      />
      {!loading ? (
        <div>
          <div>
            <HostawayAccount toggleSidebar={toggleSidebar} setOpenModal={setOpenModal}/>
          </div>
          <div className="flex justify-center pt-3 mx-8">
            <div className="w-full mx-auto p-7 bg-white shadow-md rounded-md border">
              <span className="text-2xl font-semibold text-gray-800 mb-4">
                Extension
              </span>
              <p className="text-gray-700 mb-6 text-lg py-5 border-b">
                Sign into your Stayzy AI browser extension with this key
              </p>
              <div className="flex gap-6 md:text-lg lg:text-md text-sm pb-5 font-semibold text-gray-700">
                <div>Install your extension from the Chrome Web Store</div>
                <a href="#">
                  <ExternalLink className="cursor-pointer" size={20} />
                </a>
              </div>
              <div className="flex flex-col sm:flex-row items-center mb-6">
                {extensionKey ? (
                  <div className="md:flex gap-5 items-center mb-4 sm:mb-0 w-full">
                    <div className="flex gap-6">
                      <div className="text-gray-700 truncate p-1 rounded cursor-pointer">
                        {`${encrypt}${extensionKey.slice(
                          extensionKey.length - 4,
                          extensionKey.length
                        )}`}
                      </div>
                      <button
                        onClick={handleCopy}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                      >
                        <FaRegCopy size={18} />
                      </button>
                    </div>
                    <button
                      className="p-1.5 px-3 border border-green-600 bg-green-800 hover:bg-green-900 active:bg-green-700 rounded-md font-semibold shadow-md text-white w-full md:w-auto mt-4 md:mt-0 lg:text-base md:text-xs"
                      onClick={handleGenrateKey}
                    >
                      Generate new key
                    </button>
                  </div>
                ) : (
                  <div className="text-red-500 text-sm">
                    <div className="my-5">
                      Extension key not found. Please generate a key.
                    </div>
                    <button
                      className="p-1.5 px-3 border border-green-600 bg-green-800 hover:bg-green-600 active:bg-green-700 rounded-md font-semibold shadow-md text-white w-full md:w-auto mt-4 md:mt-0"
                      onClick={handleGenrateKey}
                    >
                      Generate new key
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <SettingShimmer title={"Integrations"} />
      )}
    </>
  );
};

export default Integrations;
