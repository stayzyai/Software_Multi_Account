import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setReservations } from "../../../../store/reservationSlice";
import api from "@/api/api";

const times = [
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
  "7:00 PM",
  "8:00 PM",
  "9:00 PM",
  "10:00 PM",
  "11:00 PM",
  "12:00 AM",
  "1:00 AM",
  "2:00 AM",
  "3:00 AM",
  "4:00 AM",
  "5:00 AM",
  "6:00 AM",
  "7:00 AM",
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
];

const CheckInOutDropdown = ({ selectedTime, onSelect, chatInfo, type }) => {
  const [isOpen, setIsOpen] = useState(false);
  const reservations = useSelector((state) => state.reservations.reservations);
  const dispatch = useDispatch();

  const convertTo24Hour = (time) => {
    const [hour, modifier] = time.split(" ");
    let hour24 = parseInt(hour, 10);
    if (modifier === "PM" && hour24 !== 12) hour24 += 12;
    if (modifier === "AM" && hour24 === 12) hour24 = 0;
    return hour24 === 0 ? 24 : hour24;
  };

  const updatedCheckIn = async (updatedReservation) => {
    try {
      const data = await api.post(
        "/hostaway/update-reservation",
        updatedReservation
      );
      console.log("Updated checkIn or checkOut: ", data)

    } catch (error) {
      console.log("error at update checkIn or checkOut", error);
    }
  };

  const handleSelect = async (time) => {
    onSelect(time);
    const reservationId = chatInfo[0]["reservationId"];
    const reservation = reservations?.find((item) => item.id == reservationId);

    const hour24 = convertTo24Hour(time);
    const updatedReservation = { ...reservation };

    if (type === "checkIn") {
      updatedReservation.checkInTime = hour24;
    } else {
      updatedReservation.checkOutTime = hour24;
    }

    const updatedReservations = reservations.map((item) =>
      item.id == reservationId ? updatedReservation : item
    );
    dispatch(setReservations(updatedReservations));
    setIsOpen(false);
    await updatedCheckIn(updatedReservation);
  };

  return (
    <div className="relative">
      <div
        className="flex gap-2 items-center cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <p>{selectedTime}</p>
        {/* <img src="/icons/down.svg" alt="down icon" width={14} height={14} /> */}
      </div>
      {isOpen && (
        <div className="absolute bg-white border rounded-lg shadow-lg mt-2 max-h-48 overflow-y-auto w-[92px] text-sm scrollbar-hide z-50">
          {times.map((time) => (
            <div
              key={time}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelect(time)}
            >
              {time}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CheckInOutDropdown;
