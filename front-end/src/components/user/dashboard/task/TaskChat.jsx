import { useState } from "react";
import { FiChevronsLeft, FiChevronsRight } from "react-icons/fi";

const ChatSection = ({ setChatSection, isChatSection }) => {
  const [messages, setMessages] = useState([
    { id: 1, type: "received", text: "Hello, how can I help you?" },
    { id: 2, type: "sent", text: "My window lock is broken." },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (input.trim()) {
      const newMessage = { id: messages.length + 1, type: "sent", text: input };
      setMessages([...messages, newMessage]);
      setInput("");
    }
  };

  return (
    <div style={{ height: '-webkit-fill-available' }}
      className={`transition-all duration-300 flex-col h-full p-4 bg-[#FCFDFC] xl:w-[380px] w-[300px] border-l border-gray-300  xl:flex ${
        isChatSection
          ? "z-50 fixed xl:static top-[60px] right-0 bg-[#FCFDFC] border border-gray-300 rounded xl:rounded-none flex overflow-y-scroll"
          : "hidden xl:block border-l border-gray-300"
      }`}
    >
      <span className="text-center font-inter text-[18px] mb-6">Chat</span>
      <div className="flex-1 overflow-y-auto scrollbar-hide space-y-2">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.type === "sent" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`p-2 rounded-sm max-w-44 h-20 text-black ${
                message.type === "sent" ? "bg-gray-100" : "bg-gray-200"
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
      </div>
      <div className="py-1 px-4 bg-[#E6D0D0] text-center rounded-lg flex justify-evenly items-center m-2">
        <img width={24} height={24} src="/icons/vector.svg" />
        <span className="font-poppins text-[#EB5757] font-semibol">
          Issue Detected
        </span>
      </div>
      <div className="py-1 px-4 bg-[#9ED0EB] text-center rounded-lg flex justify-evenly items-center my-2 m-2 mb-6">
        <img width={24} height={24} src="/icons/task_icon.svg" />
        <span className="font-poppins font-semibol text-black">
          Task Created
        </span>
      </div>
      <div className="border-[0.4px] border-gray-400 rounded-[20px] flex">
        <textarea
          rows={4}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="rounded-[20px] focus:outline-none scrollbar-hide p-2 w-full"
          style={{ resize: "none" }}
        />
        <button className="mr-2 mt-16" onClick={sendMessage}>
          <img width={22} src="/icons/send.png" />
        </button>
      </div>
      <button
        onClick={() => setChatSection(!isChatSection)}
        className={`bg-gray-100 p-1 py-2 rounded-lg absolute top-1/2 right-0 xl:hidden`}
      >
        <FiChevronsLeft size={24} />
      </button>
    </div>
  );
};

export default ChatSection;
