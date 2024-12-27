import React, { useState } from "react";
import Header from "../Header";
import MessageBookingDetails from "./MessageBookingDetails";

const MessageDetails = ({ setOpenMessage, chatInfo, toggleSidebar }) => {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hello! How can I assist you?" },
  ]);
  const [input, setInput] = useState("");

  const handleSendMessage = () => {
    if (input.trim()) {
      const userMessage = { sender: "user", text: input };
      setMessages([...messages, userMessage]);

      setTimeout(() => {
        const botResponse = {
          sender: "bot",
          text: "Here's a response from the bot.",
        };
        setMessages((prevMessages) => [...prevMessages, botResponse]);
      }, 1000);

      setInput("");
    }
  };

  return (
    <div className="flex max-h-screen bg-[#fff]">
      {/* Sidebar with Messages */}
      <div className="lg:w-1/2 xl:w-1/5 bg-[#FCFDFC] border-r sm:block hidden">
        <div className="flex gap-2 mb-4 pl-5 mt-7">
          <button onClick={() => setOpenMessage(false)}>
            <img
              src="/icons/left.svg"
              alt="down icon"
              width={12}
              height={10}
              className=""
            />
          </button>
          <span className="text-[24px] font-medium">Messages</span>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center space-x-2 cursor-pointer mt-10 bg-white rounded-3xl w-full px-2 h-12"
            >
              <img
                src="/avatar.png"
                alt="User Avatar"
                className="w-10 h-10 rounded-full"
              />
              <div className="flex justify-between w-full text-[#292D32] text-nowrap text-sm">
                <div>
                  <p className="text-sm text-nowrap">Henry Smith</p>
                  <span className="text-[#292D3270] text-xs text-nowrap">
                    Test Message
                  </span>
                </div>
                <div className="text-xs">1:05 pm</div>
              </div>
              {/* */}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Content Area */}
      <div className="flex-1 flex flex-col bg-[#FCFDFC]">
        <div className="border-b">
          <Header title="Chat" messages={messages} toggleSidebar={toggleSidebar}/>
        </div>

        {/* Chat Messages */}
        <div className="flex h-[848px]">
          <div className="w-full flex flex-col mb-6">
            {chatInfo?.map((item, index) => (
              <div key={index} className="w-full p-2 flex gap-2 bg-white rounded-3xl">
                  <button className="block sm:hidden" onClick={() => setOpenMessage(false)}>
                    <img src="/icons/left.svg" alt="down icon" width={12} height={10}/>
                  </button>
                <img
                  src={item.image}
                  alt="down icon"
                  className="rounded-full w-10 h-10"
                />
                <div>
                  <span className="text-[14px]">{item.name}</span>
                  <p className="text-[12px] text-[#292D3270]">
                    Property Manager
                  </p>
                </div>
                <img
                  src="/icons/down.svg"
                  alt="down icon"
                  width={14}
                  height={14}
                />
              </div>
        
            ))}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-4 p-2 rounded-lg max-w-xs ${
                    msg.sender === "user"
                      ? "bg-[#F1F1F1] text-left ml-auto"
                      : "bg-[#F1F1F1] text-left mr-auto"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </div>
            <div className="flex items-center px-6 w-full">
              <div className="w-full">
                <div className="flex justify-end mb-6">
                  <div className="text-sm">Via Lodgify</div>
                  <img src="/icons/down.svg" alt="down icon" />
                </div>
                <div className="border h-[180px] rounded-xl  px-4">
                  <input
                    type="text"
                    placeholder="Write your reply here ..."
                    className="p-2 w-full rounded-full focus:outline-none bg-[#FCFDFC]"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <div className="flex justify-between mt-20">
                    <img src="/icons/stars.svg" />
                    <button className="rounded-md" onClick={handleSendMessage}>
                      <img src="/icons/send.png" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Booking Details Sidebar */}
          <MessageBookingDetails />
        </div>
      </div>
    </div>
  );
};

export default MessageDetails;
