import { useState } from "react";
import Header from "../Header";
import Messages from "./Messages";
import MessageDetails from "./MessageDetails";

const MessageTab = ({ toggleSidebar }) => {
  const [openMessage, setOpenMessage] = useState(false);
  const [chatInfo, setChatInfo] = useState({});
  // const [active, setActive] = useState("All");
  // const buttonLabels = ["All", "Unanswered", "Urgent", "Assigned"];

  const handleClickMessages = (id, conversations) => {
    if (chatInfo?.[0]?.id === id) return;
    setOpenMessage(true);
    const user = conversations?.filter((item) => item.id === id);
    setChatInfo(user);
  };

  return (
    <>
      {!openMessage ? (
        <div>
          <Header title="Messages" toggleSidebar={toggleSidebar} />
          <div className="bg-white mt-24">
            {/* <div className="lg:flex justify-between">
              <div className="flex mx-4 space-x-5">
                {buttonLabels?.map((label, index) => (
                  <button onClick={()=>setActive(label)}
                    key={index}
                    className={`px-1 py-2 text-[#000606] text-[15px] ${label === active? "underline underline-offset-2 text-[#2D8062]":""}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex lg:justify-end ml-2 text-[#000606] text-base mr-5">
                <button className="px-4">Channels</button>
                <button className="px-4">Filter</button>
                <button className="px-4">Sort</button>
              </div>
            </div> */}
          </div>
          <div className="md:ml-4 mx-2 md:mr-5">
            <Messages
              toggleSidebar={toggleSidebar}
              handleClickMessages={handleClickMessages}
              title={"Messages"}
            />
          </div>
        </div>
      ) : (
        <MessageDetails
          chatInfo={chatInfo}
          toggleSidebar={toggleSidebar}
          handleClickMessages={handleClickMessages}
          setOpenMessage={setOpenMessage}
        />
      )}
    </>
  );
};

export default MessageTab;
