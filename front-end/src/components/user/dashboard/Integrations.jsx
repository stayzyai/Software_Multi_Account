import { useEffect, useState } from "react";
import api from "@/api/api";
import { toast } from "sonner";
import Header from "./Header";
import { getItem } from "../../../helpers/localstorage";
import { ExternalLink, Plus } from "lucide-react";
import { FaRegCopy } from "react-icons/fa";
import SettingShimmer from "../../common/shimmer/settingShimmer";
import WhatsAppIntegrationModal from "./WhatsAppIntegrationModal";

const Integrations = () => {
  const [extensionKey, setExtensionKey] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const [hostawayAccount, setHostawayAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [whatsappSettings, setWhatsappSettings] = useState(null);
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
    
    const getWhatsAppSettings = async () => {
      try {
        const response = await api.get(`/user/settings/twilio`);
        if (response?.data?.success) {
          setWhatsappSettings(response.data.settings);
        }
      } catch (error) {
        // 404 is expected when no settings exist yet
        if (error.response?.status === 404) {
          console.log("No WhatsApp settings found - this is normal for first time");
        } else {
          console.error("Error fetching WhatsApp settings:", error);
        }
      }
    };

    getKey();
    getWhatsAppSettings();
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

  const handleModalSuccess = () => {
    // Refresh WhatsApp settings after successful save
    const getWhatsAppSettings = async () => {
      try {
        const response = await api.get(`/user/settings/twilio`);
        if (response?.data?.success) {
          setWhatsappSettings(response.data.settings);
        }
      } catch (error) {
        // 404 is expected when no settings exist yet
        if (error.response?.status === 404) {
          console.log("No WhatsApp settings found - this is normal for first time");
        } else {
          console.error("Error fetching WhatsApp settings:", error);
        }
      }
    };
    getWhatsAppSettings();
  };

  if (isHovered) {
    toast.info("Click to copy to clipboard");
  }

  return (
    <>
      <Header title={"Integrations"} role={"user"} />
      {!loading ? (
        <div className="mt-24">
          <div className="flex justify-end mb-6 px-8">
            <button
              onClick={() => setModalOpen(true)}
              className="bg-[#2D8062] hover:bg-green-800 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Integration
            </button>
          </div>
          <div className="flex justify-center pt-8 mx-8">
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

          {/* WhatsApp Integration Section */}
        {whatsappSettings && (
          <div className="flex justify-center pt-8 mx-8 mt-6">
            <div className="w-full mx-auto p-7 bg-white shadow-md rounded-md border">
              <span className="text-2xl font-semibold text-gray-800 mb-4">
                WhatsApp Notifications
              </span>
              <p className="text-gray-700 mb-6 text-lg py-5 border-b">
                Send task notifications to staff members via WhatsApp
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-green-700 font-medium">Connected</span>
                    <span className="text-gray-500 text-sm">
                      {whatsappSettings.whatsappNumber}
                    </span>
                  </div>
                  <button
                    onClick={() => setModalOpen(true)}
                    className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Edit Settings
                  </button>
                </div>
                
                {whatsappSettings.webhookUrl && (
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Webhook URL
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={whatsappSettings.webhookUrl}
                        readOnly
                        className="flex-1 p-2 bg-white border border-gray-300 rounded-md text-sm font-mono"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(whatsappSettings.webhookUrl);
                          toast.success("Webhook URL copied to clipboard!");
                        }}
                        className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-md transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      This URL is configured in your Twilio Console for receiving WhatsApp responses
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        </div>
      ) : (
        <SettingShimmer title={"Integrations"} />
      )}

      <WhatsAppIntegrationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </>
  );
};

export default Integrations;
