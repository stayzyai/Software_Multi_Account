import React, { useState } from "react";
import Header from "../Header";
import Messages from "./Messages";
import MessageDetails from "./MessageDetails";

const MessageTab = ({ toggleSidebar }) => {
  const [openMessage, setOpenMessage] = useState(false);
  const [chatInfo, setChatInfo] = useState({});

  return (
    <>
      {!openMessage ? (
        <div>
          <Header title="Messages" toggleSidebar={toggleSidebar}/>
          <div className="border-b border-black pt-4 pb-1 mb-12 bg-white">
            <div className="xl:flex justify-between">
              <div className="flex mx-7 space-x-5">
                <button className="px-4 py-2 text-[#000606] lg:text-[18px] bg-[#EBEBEB] rounded-full text-[15px]">
                  All
                </button>
                <button className="px-4 py-2 text-[#000606] lg:text-[18px] bg-[#EBEBEB] rounded-full text-[15px]">
                  Unanswered
                </button>
                <button className="px-4 py-2 text-[#000606] lg:text-[18px] bg-[#EBEBEB] rounded-full text-[15px]">
                  Urgent
                </button>
                <button className="px-4 py-2 text-[#000606] lg:text-[18px] bg-[#EBEBEB] rounded-full text-[15px]">
                  Assigned
                </button>
              </div>
              <div className="flex justify-end space-x-5 text-[#000606] text-[18px] pr-20">
                <button className="px-4">Channels</button>
                <button className="px-4">Filter</button>
                <button className="px-4">Sort</button>
              </div>
            </div>
          </div>
          <div className="md:ml-7 mx-2 md:mr-5">
            <Messages
              toggleSidebar={toggleSidebar}
              openMessage={openMessage}
              setOpenMessage={setOpenMessage}
              setChatInfo={setChatInfo}
            />
          </div>
        </div>
      ) : (
        <MessageDetails setOpenMessage={setOpenMessage} chatInfo={chatInfo} toggleSidebar={toggleSidebar}/>
      )}
    </>
  );
};

export default MessageTab;
