import { useEffect, useState } from "react";
import MessageShimmer from "../../../common/shimmer/MessageShimmer";
import { useDispatch } from "react-redux";
import { setConversations } from "../../../../store/conversationSlice";
import { simplifiedResult, getAllconversation, getConversations} from "../../../../helpers/Message";
import { useSelector } from "react-redux";
import { setMessages } from "../../../../store/messagesSlice";
import { io } from "socket.io-client";
import { updateConversation, updateMessages, filterMessages, getAllListings, getListingsName } from "../../../../helpers/Message";
import Dropdown from "./DropDown";
import { setListings } from "../../../../store/listingSlice";
import { setUnreadChat, markChatAsRead } from "../../../../store/notificationSlice";
import { useNavigate } from "react-router-dom";

const Messages = ({ handleClickMessages, title }) => {
  const [simplifiedConversation, setSimplifiedConversation] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([])
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({
    Date: "Date",
    Listing: "",
    Task: "",
  });
  const [allListings, setAllListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const dispatch = useDispatch();
  const conversation = useSelector((state) => state.conversation.conversations);
  const unreadChats = useSelector((state) => state.notifications.unreadChats);
  const  navigate =  useNavigate()

  const messages = useSelector((state) => state.messages);
  const listings = useSelector((state) => state.listings);

    const getConversationData = async () => {
      const data = await getConversations();
      dispatch(setConversations(data));
      const conversationIds = data?.map((conv) => conv.id);

      const conversationPromises = conversationIds.map(async (id) => {
        const messages = await getAllconversation(id);
        dispatch(setMessages({ id: id, message: messages }));
        return { id, messages };
      });
      const simplifiedDataArray = await Promise.all(conversationPromises);
      const simplifiedData = simplifiedResult(data, simplifiedDataArray);
      const listingData = await getAllListings();
      dispatch(setListings(listingData));
      setAllListings(getListingsName(listingData));
      setSimplifiedConversation(simplifiedData);
      setLoading(false);
    };

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_SOCKET_HOST, {
      transports: ["websocket"],
    });
    newSocket.on("connect", () => {
      console.log("Connected to WebSocket server");
    });
    newSocket.on("received_message", (newMessage) => {
      getConversationData()
      console.log("New message received: ", newMessage);
      const updatedMessages = updateMessages(
        simplifiedConversation,
        newMessage
      );
      setSimplifiedConversation(updatedMessages);
      const updatedData = updateConversation(messages, newMessage);
      dispatch(
        setMessages({ id: newMessage.conversationId, message: updatedData })
      );
      dispatch(setUnreadChat({chatId: newMessage.conversationId}))
    });
    newSocket.on("new_reservation", (reservations) => {
      const newReservation = async () => {
        const data = await getConversations();
        dispatch(setConversations(data));
        const conversation = data?.find(
          (item) => item.reservationId === reservations.reservation.id
        );
        const messages = await getAllconversation(conversation.id);
        dispatch(setMessages({ id: conversation.id, message: messages }));
        const simplifiedData = simplifiedResult(data, [
          { id: conversation.id, message: messages },
        ]);
        setSimplifiedConversation(simplifiedData);
      };
      newReservation();
    });
    return () => {
      newSocket.disconnect();
    };
  }, [messages, simplifiedConversation]);

  useEffect(() => {
    if (listings?.length !== 0) {
      setAllListings(getListingsName(listings?.listings));
    }
    if (conversation?.length !== 0 && messages?.length !== 0) {
      const simplifiedData = simplifiedResult(conversation, messages);
      setSimplifiedConversation(simplifiedData);
      setLoading(false);
      return;
    }
    getConversationData();
  }, []);

  useEffect(() => {
    const data = filterMessages(simplifiedConversation, selectedFilters);
    setFilteredConversations(data);
  }, [selectedFilters]);

  const getInitials = (name) => {
    let words = name?.trim().split(" ").slice(0, 1);
    return words
      ?.map((word) => word.charAt(0))
      .join("")
      .toUpperCase();
  };

  const handleDropdownClick = (label) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  const handleSelect = (label, value) => {
    setSelectedFilters((prev) => ({ ...prev, [label]: value }));
  };
  const isFilteringActive = selectedFilters.Date !== "Date" || selectedFilters.Listing !== "";

  return (
    <div className="px-2 sm:px-0">
      {!loading ? (
        <div className="flex flex-col space-y-6 py-4">
          <div className="overflow-hidden bg-white rounded-[14px] shadow-md mx-1 border-[0.2px] border-gray-400">
            <div className="flex justify-between p-5">
              <h2 className="text-lg font-semibold">Latest Messages</h2>
              <div className="flex gap-6 mr-4">
                <div className="flex gap-2 text-[14px] cursor-pointer">
                  <Dropdown
                    label="Date"
                    options={["Date", "Today", "Yesterday", "Last 7 Days"]}
                    isOpen={openDropdown === "Date"}
                    onClick={() => handleDropdownClick("Date")}
                    onSelect={handleSelect}
                    selectedValue={selectedFilters["Date"]}
                  />
                </div>
                <div className="flex gap-2 text-[14px] cursor-pointer">
                  <Dropdown
                    label="Listing"
                    options={allListings}
                    isOpen={openDropdown === "Listing"}
                    onClick={() => handleDropdownClick("Listing")}
                    onSelect={handleSelect}
                    selectedValue={selectedFilters["Listing"]}
                  />
                </div>
                <div className="flex gap-2 text-[14px] cursor-pointer">
                  <Dropdown
                    label="Task"
                    options={[""]}
                    isOpen={openDropdown === "Task"}
                    // onClick={() => handleDropdownClick("Task")}
                    // onSelect={handleSelect}
                    // selectedValue={selectedFilters["Task"]}
                  />
                </div>
              </div>
            </div>
            {simplifiedConversation.length === 0 ? (
              <div className="px-6 py-3 text-gray-500 flex items-center justify-center text-center border-t min-h-64 text-xl">
                No messages found
              </div>
            ) : (
              <div className="divide-y mb-6 border-y border-gray-200 mx-4 min-h-60">
                {(title === "Dashboard"
                  ? (isFilteringActive ? filteredConversations : simplifiedConversation).slice(0, 5)
                  : isFilteringActive ? filteredConversations : simplifiedConversation
                )?.map((item, index) => (
                  <div
                    key={index}
                    className={`items-center px-6 py-3 gap-4 hover:bg-gray-50 active:bg-gray-100 ${ unreadChats[item.id] && 'bg-green-100 hover:bg-green-100'}`}
                  >
                    <div className="flex items-center space-x-4">
                      {item?.recipientPicture ? (
                        <img
                          className="w-10 h-10 rounded-full"
                          src={item?.recipientPicture}
                          alt="Avatar"
                        />
                      ) : (
                        <div className="md:w-[38px] w-[44px] h-[36px] rounded-full bg-green-800 flex items-center justify-center text-xl text-white font-semibold">
                          {getInitials(item?.recipientName)}
                        </div>
                      )}
                      <div
                        onClick={() =>{
                          title !== "Dashboard" ? handleClickMessages(item.id, simplifiedConversation) : navigate(`/user/chat/${item.id}`); dispatch(markChatAsRead({chatId: item.id}))}
                        }
                        className="cursor-pointer w-full"
                      >
                        <p className="font-medium text-gray-800">
                          {item?.recipientName}
                        </p>
                        <p className="text-sm text-[#7F7F7F] hidden md:block">
                          {item?.conversationMessages}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
