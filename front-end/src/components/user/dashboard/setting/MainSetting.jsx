import Header from "../Header";
import HostawayAccount from "./HostawayAccount";
import UserProfile from "./Userprofile";

const MainSetting = () => {
  return (
    <>
      <Header title={"Settings"} role={"user"} />
      <HostawayAccount />
      <UserProfile />
    </>
  );
};

export default MainSetting;
