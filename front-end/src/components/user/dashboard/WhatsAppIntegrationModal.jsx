import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";
import { toast } from "sonner";
import api from "@/api/api";

const WhatsAppIntegrationModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    accountSid: "",
    authToken: "",
    whatsappNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [userId, setUserId] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Get user ID from token and generate webhook URL
  const generateWebhookUrl = () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.sub;
        setUserId(userId);
        const webhookUrl = `http://3.82.36.110:8000/hostaway/webhook/twilio/${userId}`;
        setWebhookUrl(webhookUrl);
        return webhookUrl;
      }
    } catch (error) {
      console.error("Error getting user ID:", error);
    }
    return null;
  };

  const copyWebhookUrl = () => {
    if (webhookUrl) {
      navigator.clipboard.writeText(webhookUrl);
      toast.success("Webhook URL copied to clipboard!");
    }
  };

  // Generate webhook URL when modal opens
  useEffect(() => {
    if (isOpen) {
      generateWebhookUrl();
    }
  }, [isOpen]);

  const handleTestConnection = async () => {
    if (!formData.accountSid || !formData.authToken || !formData.whatsappNumber) {
      toast.error("Please fill in all fields before testing");
      return;
    }

    setTesting(true);
    try {
      const response = await api.post("/user/settings/twilio/test", formData);
      if (response.data.success) {
        toast.success("Connection successful! WhatsApp integration is ready.");
      } else {
        toast.error("Connection failed. Please check your credentials.");
      }
    } catch (error) {
      console.error("Test connection error:", error);
      toast.error("Connection failed. Please check your credentials.");
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!formData.accountSid || !formData.authToken || !formData.whatsappNumber) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/user/settings/twilio", formData);
      if (response.data.success) {
        toast.success("WhatsApp integration saved successfully!");
        onSuccess && onSuccess();
        onClose();
      } else {
        toast.error("Failed to save integration. Please try again.");
      }
    } catch (error) {
      console.error("Save integration error:", error);
      toast.error("Failed to save integration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      accountSid: "",
      authToken: "",
      whatsappNumber: "",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800">
            WhatsApp Integration
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Connect your Twilio WhatsApp Business account to send task notifications to staff members.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Twilio Account SID *
              </label>
              <input
                type="text"
                name="accountSid"
                value={formData.accountSid}
                onChange={handleInputChange}
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Twilio Auth Token *
              </label>
              <input
                type="password"
                name="authToken"
                value={formData.authToken}
                onChange={handleInputChange}
                placeholder="Your Twilio Auth Token"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp Business Number *
              </label>
              <input
                type="text"
                name="whatsappNumber"
                value={formData.whatsappNumber}
                onChange={handleInputChange}
                placeholder="+1234567890"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Include country code (e.g., +1 for US)
              </p>
            </div>

            {webhookUrl && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <label className="block text-sm font-medium text-blue-800 mb-2">
                  📋 Webhook URL for Twilio Configuration
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={webhookUrl}
                    readOnly
                    className="flex-1 p-2 bg-white border border-blue-300 rounded-md text-sm font-mono"
                  />
                  <button
                    onClick={copyWebhookUrl}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  Copy this URL and paste it in your Twilio Console → WhatsApp → Sandbox Settings → Webhook URL
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleTestConnection}
              disabled={testing || loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              {testing ? "Testing..." : "Test Connection"}
            </button>
            <button
              onClick={handleSave}
              disabled={loading || testing}
              className="flex-1 px-4 py-2 bg-green-800 hover:bg-green-700 text-white rounded-md disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Integration"}
            </button>
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
            <p className="font-medium mb-1">How to get your Twilio credentials:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Sign up at <a href="https://twilio.com" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">twilio.com</a></li>
              <li>Get WhatsApp Business API access</li>
              <li>Find your Account SID and Auth Token in the Twilio Console</li>
              <li>Get your WhatsApp Business number from Twilio</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppIntegrationModal;
