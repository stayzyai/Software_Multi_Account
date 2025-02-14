import { useState } from "react";
import { FiChevronsLeft } from "react-icons/fi";
import { useSelector } from "react-redux";
import { getTimeDetails, getBookingdetails}  from "../../../../helpers/Message"
import { useEffect } from "react";

const MessageBookingDetails = ({setOpenBooking, openBooking, chatInfo }) => {

const [activeSession, setActiveSession] = useState("booking")
const reservation = useSelector((state)=>state.reservations.reservations)
const [timeDetails, setTimeDetails] = useState([])
const [bookingDetails, setbookingDetails] = useState([])

  useEffect(()=>{
    const reservationId = chatInfo[0]["reservationId"];
    const reservationData = reservation.find((item) => item.id === reservationId);
    const timeData = getTimeDetails(reservationData)
    const bookingdata = getBookingdetails(reservationData)
    setbookingDetails(bookingdata)
    setTimeDetails(timeData)
  },[chatInfo])

  return (
    <div className={`transition-all duration-300  max-h-screen w-2/3 min-h-full overflow-y-auto ${openBooking ? "w-auto block z-50 fixed top-0 right-0 bg-white border border-gray-200 rounded pb-4" : "hidden"} xl:block border-l border-gray-300`}>
      <button onClick={()=>setOpenBooking(!openBooking)} className="absolute mt-96 bg-gray-100 p-1 py-2 rounded-lg xl:hidden"><FiChevronsLeft size={24}/></button>
      <div className="bg-[#FCFDFC] p-7 space-y-6 w-[365px]">
        <div className="flex gap-8 mb-10 text-lg">
          <h2 onClick={()=>setActiveSession("booking")} className={`cursor-pointer ${activeSession === "booking"?"font-semibold underline underline-offset-2":""}`}>Booking</h2>
          <h2 onClick={()=>setActiveSession("issue")} className={`cursor-pointer ${activeSession === "issue"?"font-semibold underline underline-offset-2":""}`}>Issues</h2>
          <h2 onClick={()=>setActiveSession("upsell")} className={`cursor-pointer ${activeSession === "upsell"?"font-semibold underline underline-offset-2":""}`}>Upsell</h2>
        </div>
        <div>
          {timeDetails?.map((item, index) => {
            return (
              <div key={index} className="text-lg">
                <p className="mb-4 text-gray-500">Check in</p>
                <div className="flex gap-24 mb-8">
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
                <div className="flex gap-24">
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
      </div>
      <div className="pt-10 grid grid-cols-2 text-nowrap gap-14 pl-8 text-lg bg-[#FCFDFC] ">
        {bookingDetails?.map((item, index) => (
          <div key={index}>
            <p className="text-gray-500 mb-3">{item.label}</p>
            <p>{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MessageBookingDetails;
