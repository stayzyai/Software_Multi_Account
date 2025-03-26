import Header from "../Header";
import { Overview } from "./Overview";
import ContentCard from "./ContentCard";
import Messages from "../Messages/Messages";
import { useEffect } from "react";
import api from "../../../../api/api";
import { useDispatch } from "react-redux";
import { setUser } from "../../../../store/userSlice";

const Home = ({ role }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const getProfile = async () => {
      try {
        const response = await api.get("/user/profile");
        if (response?.status === 200 && response?.data) {
          const { firstname, lastname, email, role, ai_enable, chat_list } = response.data;
          dispatch(setUser({ firstname, lastname, email, role, ai_enable, chat_list }));
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    getProfile();
  }, []);

  return (
    <div>
      <div className="bg-[#FCFDFC] overflow-y-auto min-h-fit">
        <div className="pb-24">
          <Header title={"Dashboard"} role={role} />
        </div>
        <div className="md:px-12 px-1">
          <Overview />
          <Messages title={"Dashboard"} />
          <ContentCard />
        </div>
      </div>
    </div>
  );
};

export default Home;
