import Header from "../Header";
import HostawayAccount from "./HostawayAccount";

const MainSetting = ({ toggleSidebar, setOpenModal }) => {
  return (
    <>
      <Header title={"Settings"} toggleSidebar={toggleSidebar} role={"user"} />
      <HostawayAccount setOpenModal={setOpenModal} />
    </>
  );
};

export default MainSetting;
