import Header from "../Header";
import { Overview } from "./Overview";
import ContentCard from "./ContentCard";
import Messages from "../Messages/Messages";
import { useEffect } from "react";
import api from "../../../../api/api";
import { useDispatch } from "react-redux";
import { setUser } from "../../../../store/userSlice";

const Home = ({ toggleSidebar, role }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const getProfile = async () => {
      try {
        const response = await api.get("/user/profile");
        console.log("response", response);
        if (response?.status === 200 && response?.data) {
          const { firstname, lastname, email, role } = response.data;
          dispatch(setUser({ firstname, lastname, email, role }));
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    getProfile();
  }, []);

  return (
    <div>
      <div className="bg-[#FCFDFC] overflow-y-auto">
        <Header title={"Dashboard"} toggleSidebar={toggleSidebar} role={role} />
        <div className="border-t border-gray-400">
          <div className="px-12">
            <Overview />
            <ContentCard />
            <Messages />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
