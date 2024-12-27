import React from "react";
import { CircleUserRound, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const Header = ({ title, toggleSidebar }) => {
  const [isDropDownOpen, setIsDropDownOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);

  const toggleDropDown = () => {
    setIsDropDownOpen(!isDropDownOpen);
  };

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
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
    <div className="flex justify-between items-center mb-8">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="mr-4 md:hidden focus:outline-none"
        >
          <Menu className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
      <div className="flex items-center cursor-pointer">
        <CircleUserRound onClick={toggleDropDown} size={30} />
        {isDropDownOpen && (
          <div ref={dropdownRef}>
            <DropdownMenu />
          </div>
        )}
      </div>
    </div>
  );
};

const DropdownMenu = () => {
  const navigate = useNavigate();

  const { logout } = useAuth();
  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/admin/login");
  };

  return (
    <div className="relative">
      <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
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
