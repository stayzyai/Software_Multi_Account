import Sidebar from "../components/common/sidebar/Sidebar";
import Home from "../components/admin/dashboard/Home";
import Users from "../components/admin/dashboard/users";
import Settings from "../components/admin/dashboard/Setting";
import { Routes, Route, Navigate } from "react-router-dom";
import {setOpenModal} from "../store/sidebarSlice";

export function DashboardComponent({ role = "admin" }) {

return (
    <div className="flex h-screen bg-[#FCFDFC]">
      <Sidebar role={role}/>
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Home role={role} setOpenModal={setOpenModal} />} />
            <Route path="users/list" element={<Users setOpenModal={setOpenModal}  />} />
            <Route path="settings" element={<Settings setOpenModal={setOpenModal}  />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
