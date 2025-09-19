import { useState } from "react";
import { FiChevronsRight } from "react-icons/fi";
import { useSelector, useDispatch } from "react-redux";
import { getTimeDetails, getBookingdetails, getHostawayReservation } from "../../../../helpers/Message";
import { useEffect } from "react";
import { setReservations } from "../../../../store/reservationSlice";
import MessageRightSidebar from "../../../common/shimmer/MessageRightSidebr";
import BookingDetails from "./BookingDetails";
import BookingIssue from "./BookingIssue";
// import { io } from "socket.io-client"; // COMMENTED OUT - WebSocket disabled
import { useParams } from "react-router-dom";
// NEW IMPORTS FOR POLLING
import { useSmartPolling } from "../../../../hooks/useSmartPolling";
import StatusIndicator from "../../../common/StatusIndicator";

const MessageBookingDetails = ({ setOpenBooking, openBooking, chatInfo, sentimentLoading }) => {
  const [activeSession, setActiveSession] = useState("booking");
  const reservation = useSelector((state) => state.reservations.reservations);
  const listings = useSelector((state) => state.listings.listings);
  const [timeDetails, setTimeDetails] = useState([]);
  const [bookingDetails, setbookingDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const { messageId } = useParams();

  // POLLING HOOKS
  const pollReservations = async () => {
    console.log('Polling reservations...');
    await fetchReservations();
  };
  const { isActive, pollingInterval, lastUpdate, error, isPolling, triggerUpdate } = useSmartPolling(pollReservations, 30000);

  const getReservations = async () => {
    const data = await getHostawayReservation();
    dispatch(setReservations(data));
    setLoading(false);
    return data;
  };

  const fetchReservations = async () => {
    const reservationId = chatInfo[0]["reservationId"];
    const NewReservation = await getReservations();
    const reservationData = NewReservation?.find(
      (item) => item.id == reservationId
    );
    const timeData = getTimeDetails(reservationData);
    const bookingdata = getBookingdetails(reservationData, listings);
    setbookingDetails(bookingdata);
    setTimeDetails(timeData);
    setLoading(false);
  };

  useEffect(() => {
    if (reservation?.length !== 0) {
      const reservationId = chatInfo[0]["reservationId"];
      const reservationData = reservation?.find(
        (item) => item.id == reservationId
      );
      const timeData = getTimeDetails(reservationData);
      const bookingdata = getBookingdetails(reservationData, listings);
      setbookingDetails(bookingdata);
      setTimeDetails(timeData);
      setLoading(false);
      return;
    }
    fetchReservations();
  }, [chatInfo, messageId, listings]);

  // COMMENTED OUT - WebSocket code disabled, using polling instead
  /*
  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_SOCKET_HOST, {
      transports: ["websocket"],
    });
    newSocket.on("connect", () => {
      console.log("Connected to WebSocket server on booking details");
    });
    const handleCheckoutUpdate = async (payload) => {
      console.log("Checkout date updated:", payload);
      await fetchReservations();
    };
    newSocket.on("checkout_date_updated", handleCheckoutUpdate);

    return () => {
      newSocket.disconnect();
    };
  }, []);
  */

  if (loading)
    return (
      <div className="xl:w-[440px] 2xl:w-[440px] w-[340px]">
        <MessageRightSidebar />
      </div>
    );

  return (
    <div
      className={`transition-all duration-300 max-h-screen xl:w-[440px] 2xl:w-[440px] w-[320px] md:w-[340px] min-h-full overflow-y-auto scrollbar-hide font-inter ${
        openBooking
          ? "z-50 fixed xl:static  top-0 right-0 bg-[#FCFDFC] border border-gray-200 rounded xl:rounded-none pb-4"
          : "hidden xl:block border-l border-gray-300 "
      }`}
    >
      <button
        onClick={() => setOpenBooking(!openBooking)}
        className="absolute top-1/2 bg-gray-100 p-1 py-2 rounded-lg  md:ml-0 xl:hidden"
      >
        <FiChevronsRight size={24} />
      </button>
      <div className="pt-6 pb-3">
        <div className="pl-6">
          <div className="flex gap-8 mb-10 text-lg ml-5 md:ml-0">
            <p
              onClick={() => setActiveSession("booking")}
              className={`cursor-pointer ${
                activeSession === "booking"
                  ? "font-semibold underline underline-offset-2"
                  : ""
              }`}
            >
              Booking
            </p>
            <p
              onClick={() => setActiveSession("issue")}
              className={`cursor-pointer ${
                activeSession === "issue"
                  ? "font-semibold underline underline-offset-2"
                  : ""
              }`}
            >
              Issues
            </p>
            <p
              onClick={() => setActiveSession("upsell")}
              className={`cursor-pointer ${
                activeSession === "upsell"
                  ? "font-semibold underline underline-offset-2"
                  : ""
              }`}
            >
              Upsell
            </p>
          </div>
        </div>
        {activeSession === "booking" && (
          <BookingDetails
            bookingDetails={bookingDetails}
            timeDetails={timeDetails}
            setTimeDetails={setTimeDetails}
            chatInfo={chatInfo}
            sentimentLoading={sentimentLoading}
          />
        )}
        {activeSession == "issue" && <BookingIssue chatInfo={chatInfo} />}
      </div>
    </div>
  );
};

export default MessageBookingDetails;
