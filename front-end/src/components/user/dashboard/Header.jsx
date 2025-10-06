import React from "react";
import { Menu, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { setOpenModal } from "./../../../store/sidebarSlice";
import { useState } from "react";
import SearchResultsList from "./SearchResultsList";
import DropdownMenu from "./LogoutMenu";

const Header = ({
  title,
  role,
  messages,
  openListingName,
  openListingDetails,
  setOpenListingDetails,
}) => {
  const [isDropDownOpen, setIsDropDownOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const navigate = useNavigate();

  const firstname = useSelector((state) => state.user.firstname);
  const lastname = useSelector((state) => state.user.lastname);
  const userRole = useSelector((state) => state.user.role);
  const profileImage = useSelector((state) => state.user.image_url);
  const listings = useSelector((state) => state.listings.listings);
  const conversations = useSelector(
    (state) => state.conversation.conversations
  );
  const tasks = useSelector((state) => state.tasks.tasks);

  const toggleDropDown = () => {
    setIsDropDownOpen(!isDropDownOpen);
  };
  const dispatch = useDispatch();
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

  const handleSearch = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    if (query.trim() === "") {
      setSearchResults([]);
      return;
    }
    const filteredListings = listings.filter((item) =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );
    const filteredConversations = conversations.filter((conv) =>
      conv.recipientName?.toLowerCase().includes(searchQuery)
    );
    const filteredTasks = tasks?.filter((item) =>
      item.title.toLowerCase().includes(query.toLowerCase())
    );

    const normalizedConversations = filteredConversations.map((conv) => ({
      ...conv,
      name: conv.recipientName,
    }));
    setSearchResults([
      ...filteredListings,
      ...normalizedConversations,
      ...filteredTasks,
    ]);
  };

  const handleSelectResult = (result) => {
    if ("recipientName" in result) {
      navigate(`/user/chat/${result.id}`);
    } else if ("title" in result) {
      navigate(`/user/task/${result.id}`);
    } else {
      navigate(`/user/listing/${result.id}`);
    }
    setSearchQuery(result.name || result.content);
    setSearchResults([]);
  };

  return (
    <div
      style={{ width: "-webkit-fill-available" }}
      className={`z-30 fixed top-0 bg-[#FCFDFC] flex items-center justify-between ${
        title === "Chat" ? "pt-1" : "pt-5"
      } ${title === "Chat" ? "" : "border-b border-gray-400"} ${
        title === "Dashboard" ||
        title === "Messages" ||
        title === "Listings" ||
        title === "Integrations" ||
        title === "Settings" ||
        title === "Tasks" ||
        title === "Upsells" ||
        title === "Staff Info" ||
        title === "Staff Details"
          ? "bg-white flex items-center justify-between px-7 pb-2"
          : "flex items-center justify-between"
      } `}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={() => dispatch(setOpenModal(true))}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 md:hidden focus:outline-none"
        >
          <Menu className="h-5 w-5 text-gray-600" />
        </button>
        {!openListingDetails && title !== "Chat" && (
          <h1
            style={{
              WebkitTextStrokeWidth: "0.5px",
              WebkitTextStrokeColor: "#060606",
            }}
            className={`font-normal hidden md:block text-2xl ${
              title === "Listings" ? "text-2xl" : "xl:text-[32px]"
            }`}
          >
            {title}
          </h1>
        )}
        {openListingDetails && (
          <div className="flex items-center font-light xl:text-2xl md:text-xl text-sm">
            <button
              onClick={() => {
                setOpenListingDetails(false);
                navigate("/user/listings");
              }}
            >
              {title}
            </button>
            <ChevronDown className="sm:h-6 sm:w-7 h-4 -rotate-90" />
            <div
              className="xl:text-2xl md:text-lg text-xs font-medium cursor-pointer"
              style={{
                WebkitTextStrokeWidth: "0.2px",
                WebkitTextStrokeColor: "#060606",
              }}
            >
              {openListingName}
            </div>
          </div>
        )}
      </div>
      <div className={`flex items-center ${title === "Chat" ? "" : "gap-4"}`}>
        <div className="relative flex items-center">
          <img className="absolute left-4 w-4 h-4" src="/search.svg" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={handleSearch}
            className={`pl-12 pr-4 bg-[#E8E8E8] rounded-full focus:outline-none hidden lg:block ${
              title !== "Chat"
                ? "w-[300px] xl:w-[450px] py-2"
                : "w-[244px] h-[46px] py-3"
            }`}
          />
          <SearchResultsList
            searchResults={searchResults}
            handleSelectResult={handleSelectResult}
          />
        </div>

        <button
          className={`${
            messages || title == "Dashboard" || title == "Messages"
              ? "invisible"
              : "p-2 rounded-full"
          }`}
        ></button>

        <div
          onClick={toggleDropDown}
          className="relative flex items-center gap-3 cursor-pointer bg-white rounded-3xl px-2 py-1"
        >
          <img
            src={profileImage? profileImage : "/avatar.png"}
            alt="User avatar"
            className="rounded-full"
            width={38}
            height={38}
          />
          <div
            className={`${
              title === "Chat" ? "hidden" : "hidden md:block text-nowrap"
            }`}
          >
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

export default Header;
