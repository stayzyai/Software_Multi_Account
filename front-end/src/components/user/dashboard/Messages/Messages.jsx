import { useEffect, useState } from "react";
import MessageShimmer from "../../../common/shimmer/MessageShimmer";
import { useDispatch, useSelector } from "react-redux";
import { setConversations } from "../../../../store/conversationSlice";
// import { io } from "socket.io-client"; // COMMENTED OUT - WebSocket disabled
import {
  filterMessages,
  getAllListings,
  getListingsName,
  simplifiedResult,
  getConversationsWithResources,
} from "../../../../helpers/Message";
import Dropdown from "./DropDown";
import { setListings } from "../../../../store/listingSlice";
import { setUnreadChat } from "../../../../store/notificationSlice";
import MessageList from "./MessageList";
import { getHostawayTask } from "../../../../helpers/TaskHelper";
import TaskMultiSelect from "./TaskMultiSelect";
import MultipleSelectListing from "./MultiselectorListing"
// NEW IMPORTS FOR POLLING
import { useDataPolling } from "../../../../hooks/useDataPolling";  
import { useSmartPolling } from "../../../../hooks/useSmartPolling";
import StatusIndicator from "../../../common/StatusIndicator";
const Messages = ({ handleClickMessages, title }) => {
  const [simplifiedConversation, setSimplifiedConversation] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({
    Date: "",
    Listing: "",
    Task: "",
  });
  const [allListings, setAllListings] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedListingIds, setSelectedListingIds] = useState([])

  const dispatch = useDispatch();
  const conversation = useSelector((state) => state.conversation.conversations);
  const tasks = useSelector((state) => state.tasks.tasks);
  const listings = useSelector((state) => state.listings);

  // POLLING HOOKS
  const { pollAllData } = useDataPolling();
  const { isActive, pollingInterval, lastUpdate, error, isPolling, triggerUpdate } = useSmartPolling(pollAllData, 15000);

  const fetchedEmptyData = async () => {
    const listingData = await getAllListings();
    const taskData = await getHostawayTask();
    dispatch(setListings(listingData));
    setAllListings(getListingsName(listingData));
    setAllTasks(taskData);
  };

  const getConversationData = async (newMessage = null) => {
    const data = await getConversationsWithResources();
    dispatch(setConversations(data));
    const simplifiedData = simplifiedResult(data);
    setSimplifiedConversation(simplifiedData);
    setLoading(false);
    newMessage &&
      dispatch(setUnreadChat({ chatId: newMessage?.conversationId }));
  };

  // COMMENTED OUT - WebSocket code disabled, using polling instead
  /*
  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_SOCKET_HOST, {
      transports: ["websocket"],
    });
    newSocket.on("connect", () => {
    });
    newSocket.on("received_message", (newMessage) => {
      getConversationData(newMessage);
    });
    newSocket.on("new_reservation", (reservations) => {
      const newReservation = async () => {
        const data = await getConversationsWithResources();
        dispatch(setConversations(data));
        const simplifiedData = simplifiedResult(data);
        setSimplifiedConversation(simplifiedData);
      };
      newReservation();
    });
    return () => {
      newSocket.disconnect();
    };
  }, []);
  */

  useEffect(() => {
    if (conversation?.length !== 0 && listings?.length !== 0 && tasks?.length) {
      const simplifiedData = simplifiedResult(conversation);
      setSimplifiedConversation(simplifiedData);
      setAllListings(getListingsName(listings?.listings));
      setAllTasks(tasks);
      setLoading(false);
      return;
    }
    getConversationData();
    fetchedEmptyData();
  }, []);

  useEffect(() => {
    const data = filterMessages(simplifiedConversation, selectedFilters, selectedIds, selectedListingIds);
    setFilteredConversations(data);
  }, [selectedFilters, selectedIds, selectedListingIds]);

  const handleDropdownClick = (label) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  const handleSelect = (label, value) => {
    setSelectedFilters((prev) => ({ ...prev, [label]: value }));
  };

  return (
    <div className="px-2 sm:px-0">
      {!loading ? (
        <div className="flex flex-col space-y-6 py-4">
          <div className="overflow-hidden bg-white rounded-[14px] shadow-md mx-1 border-[0.2px] border-gray-400">
            <div className="flex flex-col gap-2 justify-between md:flex-row md:gap-0 p-5">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">Latest Messages</h2>
                <StatusIndicator 
                  isPolling={isPolling}
                  lastUpdate={lastUpdate}
                  error={error}
                  isActive={isActive}
                  pollingInterval={pollingInterval}
                />
              </div>
              <div className="flex gap-6 mr-4">
                <div className="flex items-center gap-4 text-[14px] cursor-pointer">
                  {["Date"].map((label, index) => (
                    <Dropdown
                      key={index}
                      label={label}
                      options={
                        label === "Date"
                          ? ["Today", "Yesterday", "Last 7 Days"]
                          : label === "Listing"
                          ? allListings
                          : allTasks
                      }
                      isOpen={openDropdown === label}
                      onClick={() => handleDropdownClick(label)}
                      onSelect={handleSelect}
                      selectedValue={selectedFilters[label]}
                    />
                  ))}
                  <MultipleSelectListing
                    listings={allListings}
                    setSelectedListingIds={setSelectedListingIds}
                    selectedListingIds={selectedListingIds}
                  />
                  <TaskMultiSelect
                    tasks={allTasks}
                    setSelectedIds={setSelectedIds}
                  />
                </div>
              </div>
            </div>
            <MessageList
              title={title}
              selectedFilters={selectedFilters}
              simplifiedConversation={simplifiedConversation}
              filteredConversations={filteredConversations}
              handleClickMessages={handleClickMessages}
              selectedIds={selectedIds}
              selectedListingIds={selectedListingIds}
            />
          </div>
        </div>
      ) : (
        <div className={`${title === "Dashboard" ? "mt-6" : "mx-4 mt-20"}`}>
          <MessageShimmer />
        </div>
      )}
    </div>
  );
};

export default Messages;
