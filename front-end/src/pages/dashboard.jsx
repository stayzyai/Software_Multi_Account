import { useState } from "react";
import Sidebar from "../components/common/sidebar/Sidebar";
import Home from "../components/admin/dashboard/Home";
import Users from "../components/admin/dashboard/users";
import Settings from "../components/admin/dashboard/Setting";
import HomePage from "../components/user/dashboard/home/Home";
// import Messages from "../components/user/dashboard/Messages";
import Listings from "../components/user/dashboard/listings/Listings";
import Staff from "../components/user/dashboard/Staff";
import Workflow from "../components/user/dashboard/WorkFlow";
import Tasks from "../components/user/dashboard/Tasks";
import MessageTab from "../components/user/dashboard/Messages/MessageTab";
import Integrations from "../components/user/dashboard/Integrations";
import { useEffect } from "react";
import api from "@/api/api";
import { setItem } from "../helpers/localstorage";
import HostawayConnectModal from "../components/user/hostaway/hostawayconnect";

export function DashboardComponent({ role = "admin" }) {
  const [activeSection, setActiveSection] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOpen, setOpenModal] = useState(null)
  const [iconToggle, setIconToggle] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const handleNavigation = (section) => {
    setActiveSection(section);
  };

  useEffect(()=>{
      const getHostawayAuth = async() => {
        if (role === "admin"){
          return
        }
        try{
          const response = await api.get("/hostaway/get-hostaway-account");
          if(response?.data?.detail?.valid){
            setItem("isHostwayAccount", true)
            setOpenModal(false)
            return
          }
          setOpenModal(true)
        }catch(error){
          const msg = error?.response?.data?.detail?.message
          setItem("hostawayMessage", msg)
          console.log("Error at get hostaway token", error)
        }
      }
      getHostawayAuth()
  },[activeSection, isOpen])


return (
    <div className="flex h-screen bg-[#FCFDFC]">
      <Sidebar
        role={role}
        onNavigation={handleNavigation}
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        iconToggle={iconToggle}
        setIconToggle={setIconToggle}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          {role === "admin" && (
            <div className="mx-10">
              {activeSection === "home" && (
                <Home toggleSidebar={toggleSidebar} />
              )}
              {activeSection === "users" && (
                <Users toggleSidebar={toggleSidebar} />
              )}
              {activeSection === "settings" && (
                <Settings toggleSidebar={toggleSidebar} />
              )}
            </div>
          )}

          {role === "user" && (
            <>
            <HostawayConnectModal setOpenModal = {setOpenModal} isOpen={isOpen} activeSection={activeSection}/>
              {activeSection === "home" && (
                <HomePage role={role} toggleSidebar={toggleSidebar} />
              )}
              {activeSection === "messages" && (
                <MessageTab toggleSidebar={toggleSidebar}/>
              )}
              {activeSection === "listings" && (
                <Listings toggleSidebar={toggleSidebar}/>
              )}
              {activeSection === "staff" && (
                <Staff toggleSidebar={toggleSidebar}/>
              )}
              {activeSection === "workflow" && (
                <Workflow toggleSidebar={toggleSidebar}/>
              )}
              {activeSection === "tasks" && (
                <Tasks toggleSidebar={toggleSidebar} />
              )}
              {activeSection === "integrations" && (
                <Integrations toggleSidebar={toggleSidebar}/>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
