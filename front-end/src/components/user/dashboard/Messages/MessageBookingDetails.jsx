import { useState } from "react";


const MessageBookingDetails = () => {

const [activeSession, setActiveSession] = useState("booking")

  const timeDetails = [
    {
      timeIn: {
        date: "10/20/2024",
        time: "4:00 PM",
      },
      timeOut: {
        date: "10/23/2024",
        time: "11:00 AM",
      },
    },
  ];

  const bookingDetails = [
    { label: "Resrevation", value: "Not checked in" },
    { label: "Channel", value: "Hostaway" },
    { label: "Guests", value: "3" },
    { label: "Nights", value: "4" },
    { label: "Price", value: "175" },
    { label: "AI", value: "Not enabled" },
  ];

  return (
    <div className="border-l hidden xl:block">
      <div className="bg-[#FCFDFC] p-7 space-y-6 xl:w-96 lg:w-80">
        <div className="flex gap-8 mb-10 text-lg">
          <h2 onClick={()=>setActiveSession("booking")} className={`cursor-pointer ${activeSession === "booking"?"font-semibold underline":""}`}>Booking</h2>
          <h2 onClick={()=>setActiveSession("issue")} className={`cursor-pointer ${activeSession === "issue"?"font-semibold underline":""}`}>Issues</h2>
          <h2 onClick={()=>setActiveSession("upsell")} className={`cursor-pointer ${activeSession === "upsell"?"font-semibold underline":""}`}>Upsell</h2>
        </div>
        <div>
          {timeDetails.map((item, index) => {
            return (
              <div key={index}>
                <p className="mb-4 text-gray-500">Check in</p>
                <div className="flex gap-24 mb-8">
                  <div className="flex gap-1">
                    <p>{item.timeIn.date}</p>{" "}
                    <img
                      src="/icons/down.svg"
                      alt="down icon"
                      width={14}
                      height={14}
                    />
                  </div>
                  <div className="flex gap-1">
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
                  <div className="flex gap-1">
                    <p>{item.timeOut.date}</p>{" "}
                    <img
                      src="/icons/down.svg"
                      alt="down icon"
                      width={14}
                      height={14}
                    />
                  </div>
                  <div className="flex gap-1">
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
      <div className="pt-10 grid grid-cols-2 text-nowrap gap-14 pl-8">
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
