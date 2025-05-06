import React from "react";

const ListingGuestBooking = ({ guestInfo, setGuestOpen }) => {

  return (
    <div className="mx-4">
      <div className="flex gap-2 w-full border-gray-400 border-b-[0.5px] pt-4 pb-2">
        <img
          onClick={() => setGuestOpen(false)}
          src="/icons/arrow_back.svg"
          height={20}
          width={20}
          className="cursor-pointer"
        />
        <p className="text-black text-xl font-normal">
          {guestInfo?.guestName || ""}
        </p>
      </div>

      <div className="p-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex gap-2 lg:text-xl text-md bg-white p-2 rounded-md">
            <p className="font-normal text-gray-700">Guests:</p>
            <p className="text-black">{guestInfo?.numberOfGuests}</p>
          </div>

          <div className="flex gap-2 lg:text-xl text-md bg-white p-2 rounded-md">
            <p className="font-normal text-gray-700">Night:</p>
            <p className="text-black">{guestInfo?.nights}</p>
          </div>

          <div className="flex gap-2 lg:text-xl text-md bg-white p-2 rounded-md">
            <p className="font-normal text-gray-700">Booking Status:</p>
            <p className="text-black">{guestInfo?.status}</p>
          </div>
          <div className="flex gap-2 flex-wrap lg:text-xl text-md bg-white p-2 rounded-md">
            <p className="font-normal text-gray-700">Email:</p>
            <p className="text-black break-all">
              {guestInfo?.guestEmail || ""}
            </p>
          </div>
          <div className="flex gap-2 lg:text-xl text-md bg-white p-2 rounded-md">
            <p className="font-normal text-gray-700">Check-in Date:</p>
            <p className="text-black">{guestInfo?.arrivalDate}</p>
          </div>

          <div className="flex gap-2 lg:text-xl text-md bg-white p-2 rounded-md">
            <p className="font-normal text-gray-700">Check-out Date:</p>
            <p className="text-black">{guestInfo?.departureDate}</p>
          </div>

          <div className="flex gap-2 lg:text-xl text-md bg-white p-2 rounded-md">
            <p className="font-normal text-gray-700">Check-in Time:</p>
            <p className="text-black">{guestInfo?.checkInTime}: 00</p>
          </div>

          <div className="flex gap-2 lg:text-xl text-md bg-white p-2 rounded-md">
            <p className="font-normal text-gray-700">Check-out Time:</p>
            <p className="text-black">{guestInfo?.checkOutTime}: 00</p>
          </div>

          <div className="flex gap-2 lg:text-xl text-md bg-white p-2 rounded-md">
            <p className="font-normal text-gray-700">City:</p>
            <p className="text-black">{guestInfo?.guestCity || ""}</p>
          </div>

          <div className="flex gap-2 lg:text-xl text-md bg-white p-2 rounded-md">
            <p className="font-normal text-gray-700">Zip Code:</p>
            <p className="text-black">{guestInfo?.guestZipCode || ""}</p>
          </div>

          <div className="flex gap-2 lg:text-xl text-md bg-white p-2 rounded-md">
            <p className="font-normal text-gray-700">Country:</p>
            <p className="text-black">{guestInfo?.guestCountry || ""}</p>
          </div>

          <div className="flex gap-2 lg:text-xl text-md bg-white p-2 rounded-md">
            <p className="font-normal text-gray-700">Adults:</p>
            <p className="text-black">{guestInfo?.adults || ""}</p>
          </div>

          <div className="flex gap-2 lg:text-xl text-md bg-white p-2 rounded-md">
            <p className="font-normal text-gray-700">Children:</p>
            <p className="text-black">{guestInfo?.children || ""}</p>
          </div>

          <div className="flex gap-2 lg:text-xl text-md bg-white p-2 rounded-md">
            <p className="font-normal text-gray-700">Infants:</p>
            <p className="text-black">{guestInfo?.infants || ""}</p>
          </div>

          <div className="flex gap-2 lg:text-xl text-md bg-white p-2 rounded-md">
            <p className="font-normal text-gray-700">Pets:</p>
            <p className="text-black">{guestInfo?.pets || ""}</p>
          </div>

          <div className="flex gap-2 lg:text-xl text-md bg-white p-2 rounded-md">
            <p className="font-normal text-gray-700">Total Price:</p>
            <p className="text-black">${guestInfo?.totalPrice}</p>
          </div>
 
          <div className="flex gap-2 lg:text-xl text-md bg-white p-2 rounded-md">
            <p className="font-normal text-gray-700">Address:</p>
            <p className="text-black">{guestInfo?.guestAddress || "N/A"}</p>
          </div>
          {/* Guest Portal */}
          <div className="flex gap-2 lg:text-xl text-md bg-white p-2 rounded-md ">
            <p className="font-normal text-gray-700">Guest Portal:</p>
            <a
              href={guestInfo?.guestPortalUrl}
              className="text-blue-500"
              target="_blank"
              rel="noopener noreferrer"
            >
              Access Guest Portal
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingGuestBooking;
