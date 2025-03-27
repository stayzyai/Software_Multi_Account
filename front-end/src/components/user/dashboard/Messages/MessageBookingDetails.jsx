import { useState } from "react";
import { FiChevronsRight } from "react-icons/fi";
import { useSelector, useDispatch } from "react-redux";
import { getTimeDetails, getBookingdetails, getHostawayReservation } from "../../../../helpers/Message";
import { useEffect } from "react";
import { setReservations } from "../../../../store/reservationSlice";
import MessageRightSidebar from "../../../common/shimmer/MessageRightSidebr";
import BookingDetails from "./BookingDetails";
import BookingIssue from "./BookingIssue";

const MessageBookingDetails = ({ setOpenBooking, openBooking, chatInfo }) => {
  const [activeSession, setActiveSession] = useState("booking");
  const reservation = useSelector((state) => state.reservations.reservations);
  const [timeDetails, setTimeDetails] = useState([]);
  const [bookingDetails, setbookingDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  const getReservations = async () => {
    const data = await getHostawayReservation();
    dispatch(setReservations(data));
    setLoading(false);
    return data;
  };

  useEffect(() => {
    if (reservation?.length !== 0) {
      const reservationId = chatInfo[0]["reservationId"];
      const reservationData = reservation?.find(
        (item) => item.id == reservationId
      );
      const timeData = getTimeDetails(reservationData);
      const bookingdata = getBookingdetails(reservationData);
      setbookingDetails(bookingdata);
      setTimeDetails(timeData);
      setLoading(false);
      return;
    }
    const fetchReservations = async () => {
      const reservationId = chatInfo[0]["reservationId"];
      const NewReservation = await getReservations();
      const reservationData = NewReservation?.find(
        (item) => item.id == reservationId
      );
      const timeData = getTimeDetails(reservationData);
      const bookingdata = getBookingdetails(reservationData);
      setbookingDetails(bookingdata);
      setTimeDetails(timeData);
      setLoading(false);
    };
    fetchReservations();
  }, [chatInfo]);

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
          />
        )}
        {activeSession == "issue" && <BookingIssue chatInfo={chatInfo} />}
      </div>
    </div>
  );
};

export default MessageBookingDetails;
