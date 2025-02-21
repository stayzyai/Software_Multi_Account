import Header from "../Header";
import Messages from "./Messages";
import { useNavigate } from "react-router-dom";

const MessageTab = () => {

  const navigate = useNavigate();

  const handleClickMessages = (messageId) => {
    navigate(`/user/chat/${messageId}`);
  };

  return (
    <>
      <div>
        <Header title="Messages" />
        <div className="bg-white mt-24"></div>
        <div className="md:ml-4 mx-2 md:mr-5">
          <Messages
            handleClickMessages={handleClickMessages}
            title={"Messages"}
          />
        </div>
      </div>
    </>
  );
};

export default MessageTab;
