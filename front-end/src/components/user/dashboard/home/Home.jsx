import Header from "../Header";
import { Overview } from "./Overview";
import ContentCard from "./ContentCard";
import Messages from "../Messages/Messages";
import { useEffect } from "react";
import api from "../../../../api/api";
import { useDispatch } from "react-redux";
import { setUser } from "../../../../store/userSlice";
import { io } from "socket.io-client";

const Home = ({ toggleSidebar, role }) => {
const dispatch = useDispatch();

  useEffect(() => {
      const newSocket = io(import.meta.env.VITE_SOCKET_HOST,{transports: ['websocket']});
      newSocket.on("connect", () => {
        console.log("Connected to WebSocket server");
      });
      newSocket.on("disconnect", () => {
        console.log("disconnected to WebSocket server");
      });
      newSocket.on("notify", (newMessage) => {
        console.log("Notification received: ", newMessage);
    });
    const getProfile = async () => {
      try {
        const response = await api.get("/user/profile");
        if (response?.status === 200 && response?.data) {
          const { firstname, lastname, email, role } = response.data;
          dispatch(setUser({ firstname, lastname, email, role }));
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    getProfile();
    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <div>
      <div className="bg-[#FCFDFC] overflow-y-auto min-h-fit">
        <div className="pb-24">
          <Header title={"Dashboard"} toggleSidebar={toggleSidebar} role={role}/>
        </div>
          <div className="md:px-12 px-1">
            <Overview />
            <Messages title={"Dashboard"}/>
            <ContentCard />
          </div>
      </div>
    </div>
  );
};

export default Home;
