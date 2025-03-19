import { useDispatch } from "react-redux";
import { clearUser } from "./../../../store/userSlice";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const DropdownMenu = ({ role }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { logout } = useAuth();
  const handleLogout = () => {
    dispatch(clearUser);
    logout();
    toast.success("Logged out successfully");
    window.location.reload();
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

export default DropdownMenu;
