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
import Inventory from "../components/user/dashboard/Inventory";
import Integrations from "../components/user/dashboard/Integrations";
import MessageTab from "../components/user/dashboard/Messages/MessageTab";

export function DashboardComponent({ role = "admin" }) {
  const [activeSection, setActiveSection] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const handleNavigation = (section) => {
    setActiveSection(section);
  };

  return (
    <div className="flex h-screen bg-[#FCFDFC]">
      <Sidebar
        role={role}
        onNavigation={handleNavigation}
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
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
              {activeSection === "home" && (
                <HomePage role={role} toggleSidebar={toggleSidebar} />
              )}
              {activeSection === "messages" && (
                <MessageTab toggleSidebar={toggleSidebar} />
              )}
              {activeSection === "listings" && (
                <Listings toggleSidebar={toggleSidebar} />
              )}
              {activeSection === "staff" && (
                <Staff toggleSidebar={toggleSidebar} />
              )}
              {activeSection === "workflow" && (
                <Workflow toggleSidebar={toggleSidebar} />
              )}
              {activeSection === "tasks" && (
                <Tasks toggleSidebar={toggleSidebar} />
              )}
              {activeSection === "inventory" && (
                <Inventory toggleSidebar={toggleSidebar} />
              )}
              {activeSection === "integrations" && (
                <Integrations toggleSidebar={toggleSidebar} />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
