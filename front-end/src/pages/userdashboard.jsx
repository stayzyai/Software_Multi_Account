import { useState } from "react";
import Sidebar from "../components/common/sidebar/Sidebar";
import HomePage from "../components/user/dashboard/home/Home";
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
import MainSetting from "../components/user/dashboard/setting/MainSetting";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";

export function UserDashboardComponent({ role = "user" }) {
  const [isOpen, setOpenModal] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const getHostawayAuth = async () => {
      try {
        const response = await api.get("/hostaway/get-hostaway-account");
        if (response?.data?.detail?.valid) {
          setItem("isHostwayAccount", true);
          setOpenModal(false);
          return;
        }
        setOpenModal(true);
      } catch (error) {
        const msg = error?.response?.data?.detail?.message;
        setItem("hostawayMessage", msg);
        console.log("Error at get hostaway token", error);
      }
    };
    getHostawayAuth();
  }, [isOpen, location.pathname]);

  return (
    <div className="flex h-screen bg-[#FCFDFC]">
      <Sidebar role={role} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <HostawayConnectModal />
          <Routes>
            <Route path="dashboard" element={<HomePage role={role} />} />
            <Route path="messages" element={<MessageTab  />} />
            <Route path="listings" element={<Listings  />} />
            <Route path="staff" element={<Staff  />} />
            <Route path="workflow" element={<Workflow  />} />
            <Route path="tasks" element={<Tasks  />} />
            <Route path="integrations" element={<Integrations />}/>
            <Route path="settings" element={<MainSetting />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
