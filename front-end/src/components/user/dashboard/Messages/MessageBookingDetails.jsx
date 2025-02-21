import { useState } from "react";
import { FiChevronsRight } from "react-icons/fi";
import { useSelector, useDispatch } from "react-redux";
import { getTimeDetails, getBookingdetails } from "../../../../helpers/Message";
import { useEffect } from "react";
import { setReservations } from "../../../../store/reservationSlice";
import api from "@/api/api";
import MessageRightSidebar from "../../../common/shimmer/MessageRightSidebr"

const MessageBookingDetails = ({ setOpenBooking, openBooking, chatInfo }) => {
  const [activeSession, setActiveSession] = useState("booking");
  const reservation = useSelector((state) => state.reservations.reservations);
  const [timeDetails, setTimeDetails] = useState([]);
  const [bookingDetails, setbookingDetails] = useState([]);
  const [loading, setLoading] = useState(true)
  const dispatch = useDispatch()

  const getReservations = async () => {
      try {
        const response = await api.get("/hostaway/get-all/reservations");
        if (response?.data?.detail?.data?.result) {
          const data = response?.data?.detail?.data?.result;
          dispatch(setReservations(data));
          setLoading(false)
          return data;
        }
      } catch (error) {
        setLoading(false)
        console.log("Error at get reservastion: ", error);
        return []
      }
    };

  useEffect(() => {
    if(reservation?.length !== 0){
      const reservationId = chatInfo[0]["reservationId"];
      const reservationData = reservation?.find(
        (item) => item.id === reservationId
      );
      const timeData = getTimeDetails(reservationData);
      const bookingdata = getBookingdetails(reservationData);
      setbookingDetails(bookingdata);
      setTimeDetails(timeData);
      setLoading(false)
      return
    }
    const fetchReservations = async() =>{
      const reservationId = chatInfo[0]["reservationId"];
      const NewReservation = await getReservations()
      const reservationData = NewReservation?.find(
        (item) => item.id === reservationId
      );
      const timeData = getTimeDetails(reservationData);
      const bookingdata = getBookingdetails(reservationData);
      setbookingDetails(bookingdata);
      setTimeDetails(timeData);
      setLoading(false)
    }
    fetchReservations()
  }, [chatInfo]);

  if(loading) return <div className="xl:w-[440px] 2xl:w-[440px] w-[340px]"> <MessageRightSidebar/> </div>

  return (
    <div
      className={`transition-all duration-300 max-h-screen xl:w-[440px] 2xl:w-[440px] w-[340px] min-h-full overflow-y-auto scrollbar-hide font-inter ${
        openBooking
          ? "z-50 fixed xl:static  top-0 right-0 bg-[#FCFDFC] border border-gray-200 rounded xl:rounded-none pb-4"
          : "hidden xl:block border-l border-gray-300 "
      }`}
    >
      <button
        onClick={() => setOpenBooking(!openBooking)}
        className="absolute top-1/2 bg-gray-100 p-1 py-2 rounded-lg xl:hidden">
        <FiChevronsRight size={24} />
      </button>
      <div className="pt-6 pb-3">
        <div className="pl-6">
          <div className="flex gap-8 mb-10 text-lg">
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
          {timeDetails?.map((item, index) => {
            return (
              <div key={index} className="text-lg">
                <p className="mb-4 text-gray-500">Check in</p>
                <div className="flex gap-16 xl:gap-[30px] 2xl:gap-[40px] mb-8">
                  <div className="flex gap-1 items-center text-nowrap">
                    <p>{item.timeIn.date}</p>{" "}
                    <img
                      src="/icons/down.svg"
                      alt="down icon"
                      width={14}
                      height={14}
                    />
                  </div>
                  <div className="flex gap-2 items-center text-nowrap">
                    <p>{item.timeIn.time}</p>{" "}
                    <img
                      src="/icons/down.svg"
                      alt="down icon"
                      width={14}
                      height={14}
                    />
                  </div>
                </div>
                <p className="mb-4 text-gray-500">Check out</p>
                <div className="flex gap-16 xl:gap-[30px] 2xl:gap-[40px]">
                  <div className="flex gap-2 text-nowrap items-center">
                    <p>{item.timeOut.date}</p>{" "}
                    <img
                      src="/icons/down.svg"
                      alt="down icon"
                      width={14}
                      height={14}
                    />
                  </div>
                  <div className="flex gap-2 text-nowrap items-center">
                    <p>{item.timeOut.time}</p>{" "}
                    <img
                      src="/icons/down.svg"
                      alt="down icon"
                      width={14}
                      height={14}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="pt-10 grid grid-cols-2 text-nowrap xl:gap-6 gap-12 text-lg bg-[#FCFDFC]">
          {bookingDetails?.map((item, index) => (
            <div key={index} className="ml-6">
              <p className="text-gray-500 mb-3">{item.label}</p>
              <p>{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MessageBookingDetails;
