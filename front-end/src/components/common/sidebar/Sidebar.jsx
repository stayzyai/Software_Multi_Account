import { useState } from "react";
import { Home, Users, Settings, X } from "lucide-react";

const navigationConfig = {
  admin: [
    { id: "home", label: "Home", icon: Home },
    { id: "users", label: "Users", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
  ],
  user: [
    { id: "home", label: "Dashboard", icon: "/icons/category-2.svg" },
    { id: "messages", label: "Messages", icon: "/icons/file-02.svg" },
    { id: "listings", label: "Listings", icon: "/icons/Outline.svg" },
    { id: "staff", label: "Staff", icon: "/icons/people.svg" },
    { id: "tasks", label: "Tasks", icon: "/icons/task.svg" },
    { id: "integrations", label: "Integrations", icon: "/icons/plug-01.svg"},
    { id: "settings", label: "Settings", icon: Settings },
  ],
};

const Sidebar = ({
  role = "admin",
  onNavigation,
  isOpen,
  toggleSidebar,
  iconToggle,
  setIconToggle,
}) => {
  const [activeTab, setActiveTab] = useState("home");
  const navItems = navigationConfig[role];

  const handleToggle = () => {
    setIconToggle((prevState) => !prevState);
  };

  return (
    <aside style={{height:"-webkit-fill-available"}}
      className={`min-h-fit z-50 
      fixed inset-y-0 px-6 pt-6
      bg-gradient-to-r to-[#2D8062] from-[#0E2E23] text-white
      transform transition-transform duration-300 ease-in-out
      ${isOpen ? "translate-x-0" : "-translate-x-full"}
      md:relative md:translate-x-0
    ${iconToggle ?" 2xl:w-[160px] xl:w-[9%] lg:w-[12%] md:w-[16%] w-[35%] ":" lg:w-[260px] w-[200px] "}`}
    >
      <div className="flex items-center justify-between mb-8">
        <div
          className={`flex items-center justify-center w-full  ${
            iconToggle && "mb-4"
          }`}
        >
          <img src="/logo.svg" alt="logo" className={`${iconToggle? "w-60 h-12": "w-48 h-12"}`}/>
          <img
            onClick={handleToggle}
            className={`hidden md:block rounded-full lg:p-2 p-2 bg-white cursor-pointer absolute border-[0.2px] border-gray-500 ${
              iconToggle ? " rotate-180 lg:ml-32 md:ml-32 ml-[162px] xl:ml-[120px] 2xl:ml-[150px]":" lg:ml-[260px]  ml-52 "
            }`}
            src="/icons/side.svg"
            alt="side logo"
          />
        </div>
        <button onClick={toggleSidebar} className="md:hidden">
          <X className="h-6 w-6" />
        </button>
      </div>
        <nav className="space-y-2">
          <div className="max-h-[calc(100vh-100px)] overflow-y-auto scrollbar-hide">
            {navItems?.map((item) => {
              const isImageIcon = typeof item.icon === "string";
              const isActive = activeTab === item.id;

              return (
                <div key={item.id} className="flex justify-center mb-3">
                  <button onClick={() => { onNavigation(item.id); setActiveTab(item.id); toggleSidebar(); }}
                  className={`flex items-center ${ iconToggle ? "rounded-xl scale-110 px-4 py-3 my-1"   : "w-[90%] gap-2 px-4 lg:px-6 py-3 rounded-3xl" } 
                  ${ isActive ? "bg-[#FCFDFC] text-[#0E2E23]"  : "text-white hover:bg-[#2D8062]" }`} >
                    {isImageIcon ? (
                      <img className={`w-5 h-5 ${isActive ? "filter invert" : ""}`}
                        src={item.icon}
                        alt={item.label}/>
                    ) : (
                      <item.icon
                        className={`w-5 h-5 ${
                          isActive ? "text-[#0E2E23]" : "text-white"
                        } `}
                      />
                    )}
                    {!iconToggle && (
                      <span className="lg:text-xl text-md">{item.label}</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </nav>
        {role === "user" && (
          <div
            className={`flex items-center justify-center bg-[#E8E8E8] rounded-full w-12 h-12 absolute bottom-10 ${
              iconToggle ? "ml-1" : "ml-6"
            }`}
          >
            <img src="/icons/questions.svg" alt="Question Icon" />
          </div>
        )}
    </aside>
  );
};

export default Sidebar;
