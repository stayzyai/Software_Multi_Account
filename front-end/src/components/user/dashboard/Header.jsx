import React from "react";
import { Menu, Search, ChevronDown, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useSelector, useDispatch } from "react-redux";
import { clearUser } from "./../../../store/userSlice";


const Header = ({ title, toggleSidebar, role, messages, openListingName, openListingDetails, setOpenListingDetails }) => {
  const [isDropDownOpen, setIsDropDownOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);
  const firstname = useSelector((state) => state.user.firstname);
  const lastname = useSelector((state) => state.user.lastname);
  const userRole = useSelector((state) => state.user.role);
  const toggleDropDown = () => {
    setIsDropDownOpen(!isDropDownOpen);
  };

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropDownOpen(false);
      }
    };

    if (isDropDownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropDownOpen]);

  return (
    <div style={{width:"-webkit-fill-available"}}
      className={`fixed top-0 bg-[#FCFDFC] flex items-center justify-between pb-2 ${title === "Chat" ? "pt-3": "pt-6"} ${ title === "Chat" ? "": "border-b border-gray-400"} ${
        title === "Dashboard" || title === "Messages" || title === "Listings" || title === "Integrations" || title === "Settings"
          ? "bg-white flex items-center justify-between px-7 pb-2"
          : "flex items-center justify-between"
      } `}
    >
      <div
       className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 md:hidden focus:outline-none"
        >
          <Menu className="h-5 w-5 text-gray-600" />
        </button>
        {!openListingDetails && title !== "Chat" && (
          <h1  style={{"-webkit-text-stroke-width": "0.5px", "-webkit-text-stroke-color":"#060606"}} className="xl:text-[32px] font-normal hidden md:block text-2xl">
            {title}
          </h1>
        )}
          {openListingDetails && (
          <div className="flex items-center font-light xl:text-2xl md:text-xl text-sm">
            <button onClick={()=>{setOpenListingDetails(false)}} >
            {title}
          </button >
          <ChevronDown className="sm:h-6 sm:w-7 h-4 -rotate-90"/>
          <div className="xl:text-2xl md:text-lg text-sm font-medium cursor-pointer" style={{"-webkit-text-stroke-width": "0.2px", "-webkit-text-stroke-color":"#060606"}}>{openListingName}</div>
        </div>)}
      </div>
      <div className={`flex items-center ${title === "Chat" ? "":"gap-4"}`}>
        <div className="relative flex items-center">
          <img className="absolute left-4 w-4 h-4" src="/search.svg" />
          <input
            type="text"
            placeholder="Search"
            className={`pl-12 pr-4 bg-[#E8E8E8] rounded-full focus:outline-none hidden lg:block ${title !== "Chat"?"w-[300px] xl:w-[450px] py-2":"w-[244px] py-3"}`}
          />
        </div>

        <button
          className={`${
            messages || title =="Dashboard" || title =="Messages"  ? "invisible" : "p-2 rounded-full"
          }`}
        >
          {/* <img
            src="/message-text.png"
            alt="User avatar"
            width={30}
            height={30}
          /> */}
        </button>

        <div
          onClick={toggleDropDown}
          className="relative flex items-center gap-3 cursor-pointer bg-white rounded-3xl px-2 py-1"
        >
          <img
            src="/avatar.png"
            alt="User avatar"
            className="rounded-full"
            width={38}
            height={38}
          />
          <div className={`${title === "Chat" ? "hidden":"hidden md:block text-nowrap"}`}>
            <p className="text-sm font-medium capitalize">{`${firstname} ${lastname}`}</p>
            <p className="text-xs text-gray-500 capitalize">{userRole}</p>
          </div>
          <button className="p-1 hover:bg-gray-100 rounded-full">
            <ChevronDown className="h-4 w-4 text-gray-600" />
          </button>
          <div>
            {isDropDownOpen && (
              <div ref={dropdownRef}>
                <DropdownMenu role={role} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const DropdownMenu = ({ role }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch()

  const { logout } = useAuth();
  const handleLogout = () => {
    dispatch(clearUser)
    logout();
    toast.success("Logged out successfully");
    navigate(`/user/login`);
  };

  return (
    <div className="relative bg-white">
      <div className="origin-top-right absolute right-0 mt-8 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
        <div
          className="py-1"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="options-menu"
        >
          <button
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            role="menuitem"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;
