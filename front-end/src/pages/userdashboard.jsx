import { useState } from "react";
import Sidebar from "../components/common/sidebar/Sidebar";
import HomePage from "../components/user/dashboard/home/Home";
import Listings from "../components/user/dashboard/listings/Listings";
import StaffTab from "../components/user/dashboard/staff/StaffTab";
import MessageTab from "../components/user/dashboard/Messages/MessageTab";
import Integrations from "../components/user/dashboard/Integrations";
import { useEffect } from "react";
import api from "@/api/api";
import { setItem } from "../helpers/localstorage";
import HostawayConnectModal from "../components/user/hostaway/hostawayconnect";
import MainSetting from "../components/user/dashboard/setting/MainSetting";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import MessageDetailsWrapper from "../components/user/dashboard/Messages/MessageDetailsWrapper";
import ListingsWraper from "../components/user/dashboard/listings/ListingsWrapper"
import TasksTab from "../components/user/dashboard/task/TasksTab";
import TaskDetailsWrapper from "../components/user/dashboard/task/TaskDetailsWrapper"
import UpsellTab from "../components/user/dashboard/upsell/UpsellTab"
import ReportIssuePopup from "../components/user/dashboard/common/ReportIssue";


export function UserDashboardComponent({ role = "user" }) {
  const [isOpen, setOpenModal] = useState(false);
  const [showPopup, setShowPopup] = useState(false)
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
      <Sidebar role={role} setShowPopup={setShowPopup} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-x-hidden md:overflow-auto md:overflow-x-auto">
          <HostawayConnectModal />
          {showPopup && <ReportIssuePopup onClose={() => setShowPopup(false)} />}
          <Routes>
            <Route path="dashboard" element={<HomePage role={role} />} />
            <Route path="messages" element={<MessageTab  />} />
            <Route path="listings" element={<Listings  />} />
            <Route path="staff" element={<StaffTab  />} />
            <Route path="tasks" element={<TasksTab  />} />
            <Route path="integrations" element={<Integrations />}/>
            <Route path="settings" element={<MainSetting />} />
            <Route path="chat/:messageId" element={ <MessageDetailsWrapper/>} />
            <Route path="listing/:listingId" element={ <ListingsWraper/>} />
            <Route path="task/:taskId" element={ <TaskDetailsWrapper/>} />
            <Route path="upsell" element={ <UpsellTab/>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
