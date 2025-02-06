import { ChevronRight } from "lucide-react";

const BookingGroup = ({ dateRange, bookings }) => {
  return (
    <div className="space-y-2 text-[#000000]">
      <div className="text-[22px] font-semibold border-b border-gray-300 py-1 font-inter">{dateRange}</div>
      {!bookings ? (
        <p className="font-light text-[18px]">No Bookings</p>
      ) : (
        bookings?.map((booking) => (
          <div key={booking.id} className="cursor-pointer pt-5">
            <div className="p-4 border border-gray-300 rounded-[10px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-[#D9D9D9] rounded-full">
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-xl">{booking.guestName}</p>
                    <div className="text-[15px]">
                      <p>
                        {booking.nights}{" "}
                        {booking.nights === 1 ? "Night" : "Nights"}
                      </p>
                      <p>
                        {booking.guests}{" "}
                        {booking.guests === 1 ? "Guest" : "Guests"}
                      </p>
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

const ListingBookingDetails = ({calenderDetails}) => {

  return (
    <div className="w-full mt-7">
      <main>
        <div>
          <div className="p-6 space-y-8">
            {calenderDetails.dateRanges?.map((range, index) => (
              <BookingGroup
                key={range}
                dateRange={range}
                bookings={calenderDetails?.bookings[index] ? [calenderDetails.bookings[index]] : null}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ListingBookingDetails;
