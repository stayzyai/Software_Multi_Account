import { Home, Users, Settings, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { setIconToggle, setOpenModal } from "../../../store/sidebarSlice";
import { useNavigate, useLocation } from "react-router-dom";

const navigationConfig = {
  admin: [
    { id: "home", label: "Home", icon: Home, route: "/admin/dashboard" },
    { id: "users", label: "Users", icon: Users , route: "/admin/users/list" },
    { id: "settings", label: "Settings", icon: Settings, route: "/admin/settings" },
  ],
  user: [
    { id: "home", label: "Dashboard", icon: "/icons/category-2.svg", route: "/user/dashboard" },
    { id: "messages", label: "Messages", icon: "/icons/file-02.svg", route: "/user/messages" },
    { id: "listings", label: "Listings", icon: "/icons/Outline.svg", route: "/user/listings" },
    { id: "tasks", label: "Tasks", icon: "/icons/task.svg", route: "/user/tasks" },
    { id: "upsell", label: "Upsells", icon: "/icons/upsell.svg", route: "/user/upsell" },
    // { id: "staff", label: "Staff", icon: "/icons/people.svg", route: "/user/staff" },
    { id: "integrations", label: "Integrations", icon: "/icons/plug-01.svg", route: "/user/integrations",},
    { id: "settings", label: "Settings", icon: Settings, route: "/user/settings" },
  ],
};

const Sidebar = ({ role = "admin" }) => {
  const { iconToggle, isOpen } = useSelector((state) => state.sidebar);
  // const [activeTab, setActiveTab] = useState("home");
  const navItems = navigationConfig[role];
  const dispatch = useDispatch()
  const navigate = useNavigate();
  const location = useLocation();

  const handleToggle = () => {
    dispatch(setIconToggle(!iconToggle));
  };
  const unreadNotifications = useSelector((state) => state.notifications.unreadChats);

  const handleNavigation = (item) => {
    // setActiveTab(item.id);
    dispatch(setOpenModal(false));
    navigate(item.route);
  }
  const hasUnreadMessages = unreadNotifications && Object.values(unreadNotifications).some((value) => value === true);

  return (
    <aside style={{height:"-webkit-fill-available"}}
      className={`min-h-fit z-50 
      fixed inset-y-0 ${iconToggle? "px-4": "px-6"}
      bg-gradient-to-r to-[#2D8062] from-[#0E2E23] text-white
      transform transition-transform duration-300 ease-in-out
      ${isOpen ? "translate-x-0" : "-translate-x-full"}
      md:relative md:translate-x-0
    ${iconToggle ?" 2xl:w-[120px] xl:w-[105px] lg:w-[110px] md:w-[120px] w-[35%] ":" lg:w-[260px] w-[200px] "}`}
    >
      <div className="flex items-center justify-between mb-8">
        <div
          className={`flex items-center justify-center w-full ${iconToggle && "mb-4"}`}>
          <img src="/icons/white-transparent.svg" alt="logo" className={`${iconToggle? "pt-4": "pt-5"}`}/>
          <img
            onClick={handleToggle}
            className={`hidden md:block rounded-full xl:p-1.5 p-1 xl:h-[28px] h-[26px] bg-white cursor-pointer absolute border-[0.2px] border-gray-500 ${
              iconToggle ? "mt-[32px] rotate-180 lg:ml-[112px] md:ml-[120px] ml-[162px] xl:ml-[105px] 2xl:ml-[120px] ":" lg:ml-[260px] ml-52 mt-[30px]"
            }`}
            src="/icons/side.svg"
            alt="side logo"
          />
        </div>
        <button onClick={()=> dispatch(setOpenModal(false))} className="md:hidden">
          <X className="h-6 w-6" />
        </button>
      </div>
        <nav className="space-y-2">
          <div className="max-h-[calc(100vh-100px)] overflow-y-auto scrollbar-hide">
            {navItems?.map((item) => {
              const isImageIcon = typeof item.icon === "string";
              const isActive = location.pathname === item.route || (item.id === "messages" && (location.pathname.startsWith("/user/messages") || location.pathname.startsWith("/user/chat/"))) || (item.id === "listings" && (location.pathname.startsWith("/user/listings") || location.pathname.startsWith("/user/listing/"))) || (item.id === "tasks" && (location.pathname.startsWith("/user/tasks") || location.pathname.startsWith("/user/task")));
              return (
                <div key={item.id} className="flex justify-center mb-3">
                  <button onClick={() => {handleNavigation(item)}}
                  className={`flex items-center ${ iconToggle ? "rounded-xl scale-110 px-4 py-3 my-1"   : "w-[90%] gap-2 px-4 lg:px-6 py-3 rounded-3xl" } 
                  ${ isActive ? "bg-[#FFFFFF] text-[#060606]"  : "text-[#FFFFFF] hover:bg-[#2D8062]" }`} >
                    {isImageIcon ? (
                      <img className={`w-5 h-5 ${isActive ? "filter invert" : ""}`}
                        src={item.icon}
                        alt={item.label}/>
                    ) : (
                      <item.icon
                        className={`w-5 h-5 ${
                          isActive ? "text-[#060606]" : "text-white"
                        } `}
                      />
                    )}
                    {!iconToggle && (
                      <span className={`lg:text-xl text-md ${ isActive ? "text-[#060606]" : "text-[#F1F1F1]"}`}>{item.label}</span>
                    )}
                    {item.id === "messages" && hasUnreadMessages && ( <span className={`${ iconToggle  ? "w-2 h-2 bg-red-500 rounded-full fixed left-10 top-2" : "w-3 h-3 bg-red-500 rounded-full fixed top-44 left-[152px] sm:left-40 md:left-[150px] lg:left-48" }`}
                    />
                  )}
                  </button>
                </div>
              );
            })}
          </div>
        </nav>
        {role === "user" && (
          <div
            className={`flex items-center justify-center bg-[#E8E8E8] rounded-full w-12 h-12 absolute bottom-10 ml-6`}
          >
            <img src="/icons/questions.svg" alt="Question Icon" />
          </div>
        )}
    </aside>
  );
};

export default Sidebar;
