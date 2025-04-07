import React, { useState, useEffect } from "react";
import { FiChevronsLeft } from "react-icons/fi";
import {
  simplifiedResult,
  filterReservations,
  getIdsWithLatestIncomingMessages,
  getHostawayReservation,
  getAllListings,
} from "../../../../helpers/Message";
import { useSelector, useDispatch } from "react-redux";
import FilterModal from "../Messages/MessageFilter";
import { setReservations } from "../../../../store/reservationSlice";
import { useNavigate } from "react-router-dom";
import { setListings } from "../../../../store/listingSlice";
import MessageChatDetails from "./MessageChatDetails";
import ChatSidebar from "./MessageSidebar";

const MessageDetails = ({
  chatInfo,
  handleClickMessages,
  fromatedConversation,
  setMessage,
  messages,
  setInput,
  input,
  messageLoader,
  handleSendMessage,
}) => {
  const conversation = useSelector((state) => state.conversation.conversations);
  const reservation = useSelector((state) => state.reservations.reservations);
  const listings = useSelector((state) => state.listings.listings);
  const [openBooking, setOpenBooking] = useState(false);
  const [openSidebarMessage, setOpenSidebarMessage] = useState(false);
  const [openFilter, setOpenFilter] = useState(null);
  const [filters, setFilters] = useState({
    quickFilter: "",
    selectedListing: "",
  });
  const [filteredConversations, setFilteredConversations] = useState([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const getListings = async () => {
    const data = await getAllListings();
    const reservationData = await getHostawayReservation();
    dispatch(setReservations(reservationData));
    dispatch(setListings(data));
  };
  useEffect(() => {
    if (reservation?.length !== 0) {
      getListings();
    }
  }, []);

  const handleApplyFilter = () => {
    const data = filterReservations(reservation, filters);
    const listingMapIds = data?.map((item) => item.listingMapId);
    let matchingConversations = conversation?.filter((convo) =>
      listingMapIds.includes(convo.listingMapId)
    );
    if (filters.quickFilter == "last_message") {
      const latestIncomingIds = getIdsWithLatestIncomingMessages(conversation);
      matchingConversations = matchingConversations.filter((convo) =>
        latestIncomingIds.includes(convo.id)
      );
    }
    setFilteredConversations(simplifiedResult(matchingConversations));
    setOpenFilter(false);
  };

  return (
    <div className="flex max-h-screen bg-[#fff]">
      <div
        className={`transition-all duration-300 ${
          openSidebarMessage
            ? "z-50 sm:z-0 fixed sm:sticky top-[70px] sm:top-0 h-full sm:h-auto left-0 bg-white"
            : "hidden md:block"
        } lg:w-[244px] xl:w-[257px] bg-[#FCFDFC] border-r border-gray-300`}
      >
        <div className="flex gap-2 pl-6 mt-4">
          <button onClick={() => navigate("/user/messages")}>
            <img src="/icons/left.svg" alt="down icon" width={12} height={10} />
          </button>
          <span
            style={{ WebkitTextStrokeWidth: "0.5px" }}
            className="text-2xl font-medium"
          >
            {" "}
            Messages{" "}
          </span>
        </div>
        {openFilter && (
          <FilterModal
            setOpenFilter={setOpenFilter}
            listings={listings}
            setFilters={setFilters}
            filters={filters}
            handleApplyFilter={handleApplyFilter}
            setFilteredConversations={setFilteredConversations}
          />
        )}
        <div
          onClick={() => setOpenFilter(true)}
          className="flex justify-end mx-2 cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="21"
            height="21"
            viewBox="0 0 21 21"
            fill="none"
          >
            <path
              d="M5.65385 10.5H15.3462M3.5 6.125H17.5M8.88461 14.875H12.1154"
              stroke="black"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <ChatSidebar
          filters={filters}
          filteredConversations={filteredConversations}
          fromatedConversation={fromatedConversation}
          handleClickMessages={handleClickMessages}
        />
        <button
          onClick={() => setOpenSidebarMessage(!openSidebarMessage)}
          className="bg-gray-100 p-1 py-2 rounded-lg ml-52 sm:hidden block absolute top-1/2"
        >
          <FiChevronsLeft size={24} />
        </button>
      </div>
      <MessageChatDetails
        messages={messages}
        setMessage={setMessage}
        handleSendMessage={handleSendMessage}
        setInput={setInput}
        input={input}
        setOpenBooking={setOpenBooking}
        openBooking={openBooking}
        setOpenSidebarMessage={setOpenSidebarMessage}
        openSidebarMessage={openSidebarMessage}
        chatInfo={chatInfo}
        messageLoader={messageLoader}
      />
    </div>
  );
};

export default MessageDetails;
