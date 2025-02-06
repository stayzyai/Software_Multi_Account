const getOccupancy = (reservations, id) => {
  const filteredReservations = reservations.filter((res) => res.listingMapId === id);
  const isOccupied = filteredReservations.some((reservation) => {
    const today = new Date();
    const arrivalDate = new Date(reservation.arrivalDate);
    const departureDate = new Date(reservation.departureDate);
        return today >= arrivalDate && today <= departureDate;
  });
  return isOccupied ? "Occupied" : "Vacant";
};

const formattedListing = (data, reservations) => {
  const listings = data?.map((item) => {
    const occupancy = getOccupancy(reservations, item.id);
    return {
      id: item.id,
      property: item.name,
      address: item.address,
      occupancy: occupancy,
      issues: "No Issues",
      ai : "Not Enabled"
    };
  });

  return listings;
};

const getListing  = (data)=>{
  const sections = [
    {
      title: "Basic Details",
      content: [
        { label: "Bed", value: data.bedsNumber || "Not specified" },
        { label: "Bath", value: data.bathroomsNumber || "Not specified" },
        { label: "Address", value: data.address || "Not available" },
        { label: "Accommodates", value: `${data.personCapacity} guest${data.personCapacity > 1 ? "s" : ""}` },
        { label: "Room type", value: data.roomType ? data.roomType.replace("_", " ") : "Not specified" },
        { label: "Property type", value: data.name },
      ],
    },
    {
      title: "Amenities",
      content: [
        {
          // label: "Amenities",
          value: data.listingAmenities.length !== 0 
            ? data.listingAmenities.map((amenity) => amenity.amenityName).join(", ") 
            : "Not specified",        
        },
      ],
    },
    {
      title: "Prices",
      content: [
        { label: "Nightly rate", value: `$${data?.price}` },
        { label: "Weekly Discount", value: data.weeklyDiscount ? `${data.weeklyDiscount}%` : "None" },
        { label: "Monthly Discount", value: data.monthlyDiscount ? `${data.monthlyDiscount}%` : "None" },
        { label: "Price for extra person", value: `$${data.priceForExtraPerson} per night` },
      ],
    },
    {
      title: "Additional Details",
      content: [
        { label: "Instant bookable", value: data.instantBookable ? "Yes" : "No" },
        { label: "Wi-Fi Username", value: data.wifiUsername || "-" },
        { label: "Wi-Fi Password", value: data.wifiPassword || "-" },
        { label: "Person Capacity", value: data.personCapacity || "-" },
        { label: "Check-in time start", value: data.checkInTimeStart ? `${data.checkInTimeStart}:00pm` : "-" },
        { label: "Check-in time end", value: data.checkInTimeEnd || "-" },
        { label: "Check-out time", value: data.checkOutTime ? `${data.checkOutTime}:00pm` : "-" },
        { label: "Square Meters", value: data.squareMeters || "-" },
        { label: "Listing's cleanness status", value: data.cleannessStatus || "Unknown" },
        { label: "Cleaning instruction", value: data.cleaningInstruction || "-" },
      ],
    },
    {
      title: "Cancellation",
      content: [
        { label: "Policy", value: data?.cancellationPolicy.charAt(0).toUpperCase() + data?.cancellationPolicy.slice(1) },
        {
          label: "Details",
          value: `This property has a ${data?.cancellationPolicy} cancellation policy.`,
        },
      ],
    },
  ];
  
  return sections
}

const formatReservations = (reservations, listingMapId) => {

  if (!reservations || reservations.length === 0) return { bookings: [], dateRanges: [] };
  const filteredReservations = reservations?.filter(
    (res) => res?.listingMapId === listingMapId
  );

  const sortedReservations = [...filteredReservations].sort(
    (a, b) => new Date(a.arrivalDate) - new Date(b.arrivalDate)
  );

  const bookings = [];
  const dateRanges = [];

  for (let i = 0; i < sortedReservations.length; i++) {
    const res = sortedReservations[i];
    const nextRes = sortedReservations[i + 1];

    const startDate = new Date(res?.arrivalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endDate = new Date(res?.departureDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    bookings.push({
      id: res?.reservationId?.toString(),
      guestName: res?.guestName,
      startDate,
      endDate,
      nights: res?.nights,
      guests: res?.numberOfGuests,
    });
    dateRanges.push(`${startDate} - ${endDate}`);

    if (nextRes && new Date(res?.departureDate) < new Date(nextRes?.arrivalDate)) {
      const gapStart = endDate;
      const gapEnd = new Date(nextRes?.arrivalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      bookings.push(null);
      dateRanges.push(`${gapStart} - ${gapEnd}`);
    }
  }

  return { bookings, dateRanges };
};
const extractPropertyDetails = (listing) => {
  const propertyDetails = listing;
  return {
    propertyName: propertyDetails.name || "Test Listing",
    propertyAddress: propertyDetails.address || "Not provided",
    propertyPersonCapacity: propertyDetails.personCapacity || "Not specified",
    propertyBedroomsNumber: propertyDetails.bedroomsNumber || "Not specified",
    propertyBathroomsNumber: propertyDetails.bathroomsNumber || "Not specified",
    checkInTime: propertyDetails.checkInTimeStart || "Not specified", 
    checkOutTime: propertyDetails.checkOutTime || "Not specified",
    cancellationPolicy: propertyDetails.cancellationPolicy || "strict",
    minNights: propertyDetails.minNights || "Not specified",
    doorSecurityCode: propertyDetails.doorSecurityCode || "not specified",
    specialInstructions: propertyDetails.specialInstruction || "None"
  };
}

const formatedFAQ = (listing) => {
  const { propertyName, propertyAddress, propertyPersonCapacity, propertyBedroomsNumber,
      propertyBathroomsNumber, checkInTime, checkOutTime, cancellationPolicy, minNights,
      doorSecurityCode, specialInstructions } = extractPropertyDetails(listing);

      const InfoData = [
        {
          id: "faq",
          title: "Frequently Asked Questions",
          content: "Common questions and answers about our services and features.",
        },
        {
          id: "property",
          title: "About Property",
          content: "Learn more about our spacious rooms, high-end facilities, and nearby attractions.",
        },
        {
          id: "checkin",
          title: "Check-in/Check-out",
          content: "Check-in time starts at 3:00 PM, and check-out is at 11:00 AM. Early check-in or late check-out can be arranged based on availability,",
        },
        {
          id: "codes",
          title: "Code/Locks",
          content: "These codes will be provided to you upon check-in and will remain active throughout your stay.",
        },
        {
          id: "policies",
          title: "Policies",
          content: "Our policies are strict. Kindly review our complete policy for more details.",
        },
      ];
      

  return InfoData;
};


export { formattedListing, getListing, formatReservations, formatedFAQ };
