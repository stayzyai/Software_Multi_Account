import React, { useEffect, useState } from "react";
import { reportIssues } from "../../../../helpers/user";
import { toast } from "sonner";

const ReportIssuePopup = ({ onClose }) => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Subject and message cannot be empty");
      return;
    }
    setIsLoading(true);
    const payload = { subject, message };
    const response = await reportIssues(payload);
    if (response) {
      toast.success("Issue reported successfully");
    } else {
      toast.error("Failed to report issue");
    }
    handleClose();
    setIsLoading(false);
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
      <div
        className={`bg-[#fffffffa] rounded-lg shadow-xl py-3 px-4 w-full max-w-lg border border-gray-300 transform transition-all duration-200 ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold text-black">Report Issue</h2>
          <button
            onClick={handleClose}
            className="text-gray-600 hover:text-black text-2xl"
          >
            ×
          </button>
        </div>

        <label className="block text-sm font-medium mb-1 mt-2">Subject</label>
        <input
          type="text"
          className="w-full border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring focus:border-green-500 text-black"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          required
        />
        <label className="block text-sm font-medium mb-1 mt-2">Message</label>
        <textarea
          className="w-full border border-gray-300 rounded px-3 py-2 h-28 resize-none focus:outline-none focus:ring focus:border-green-500 text-black"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe your issue here..."
          required
        />
        <button
          onClick={handleSend}
          className="w-full bg-green-900 hover:bg-green-800 text-white font-semibold py-1 my-2 rounded"
        >
          {isLoading ? "Sending..": "Send"}
        </button>
      </div>
    </div>
  );
};

export default ReportIssuePopup;
