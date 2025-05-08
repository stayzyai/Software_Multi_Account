import api from "@/api/api";
import { toast } from "sonner";

const getOccupancy = (reservations, id) => {
  const filteredReservations = reservations.filter(
    (res) => res.listingMapId === id
  );
  const isOccupied = filteredReservations.some((reservation) => {
    const today = new Date();
    const arrivalDate = new Date(reservation.arrivalDate);
    const departureDate = new Date(reservation.departureDate);
    return today >= arrivalDate && today <= departureDate;
  });
  return isOccupied ? "Occupied" : "Vacant";
};

const getListingstatus = async () => {
  try {
    const response = await api.get("/subscription/listing-status");
    if (response?.data) {
      return response?.data?.data;
    }
    return [];
  } catch (error) {
    console.log("Error at getListingstatus", error.message);
    console.error("Error fetching listing status:", error);
    return [];
  }
};

const formattedListing = (data, reservations, userData=null, issues= []) => {
  const listings = data?.map((item) => {
    const occupancy = getOccupancy(reservations, item.id);
    const aiStatus = userData?.ai_enable
    const hasIssue = issues?.some((issue) => issue?.listingMapId === item?.id);
    return {
      id: item.id,
      property: item.name,
      address: item.address,
      occupancy: occupancy,
      issues: hasIssue ? "Issue" : "No Issue",
      ai: aiStatus ? "Enabled" : "Not Enabled",
    };
  });

  return listings;
};

const getListing = (data) => {
  const sections = [
    {
      title: "Basic Details",
      content: [
        { label: "Bed", value: data?.bedsNumber || "Not specified" },
        { label: "Bath", value: data?.bathroomsNumber || "Not specified" },
        { label: "Address", value: data?.address || "Not available" },
        {
          label: "Accommodates",
          value: data?.personCapacity ? `${data?.personCapacity} guest${data?.personCapacity > 1 ? "s" : ""}` : "",
        },
        {
          label: "Room type",
          value: data?.roomType
            ? data?.roomType.replace("_", " ")
            : "Not specified",
        },
        { label: "Property type", value: data?.name || "" },
      ],
    },
    {
      title: "Amenities",
      content: [
        {
          value:
            data?.listingAmenities.length !== 0
              ? data?.listingAmenities.map((amenity) => amenity.amenityName)
              : "Not specified",
        },
      ],
    },
    {
      title: "Prices",
      content: [
        { label: "Nightly rate", value: data?.price ? `$${data?.price || ""}`: "" },
        {
          label: "Weekly Discount",
          value: data?.weeklyDiscount ? `${data?.weeklyDiscount|| "N/A"}%` : "None",
        },
        {
          label: "Monthly Discount",
          value: data?.monthlyDiscount ? `${data?.monthlyDiscount || "N/A"}%` : "None",
        },
        {
          label: "Price for extra person",
          value:  data?.priceForExtraPerson ? `$${data?.priceForExtraPerson} per night`: "",
        },
      ],
    },
    {
      title: "Additional Details",
      content: [
        {
          label: "Instant bookable",
          value: data?.instantBookable ? "Yes" : "No",
        },
        { label: "Wi-Fi Username", value: data?.wifiUsername || "-" },
        { label: "Wi-Fi Password", value: data?.wifiPassword || "-" },
        { label: "Person Capacity", value: data?.personCapacity || "-" },
        {
          label: "Check-in time start",
          value: data?.checkInTimeStart ? `${data?.checkInTimeStart || ""}:00pm` : "-",
        },
        { label: "Check-in time end", value: data?.checkInTimeEnd || "-" },
        {
          label: "Check-out time",
          value: data?.checkOutTime ? `${data?.checkOutTime}:00pm` : "-",
        },
        { label: "Square Meters", value: data?.squareMeters || "-" },
        {
          label: "Listing's cleanness status",
          value: data?.cleannessStatus || "Unknown",
        },
        {
          label: "Cleaning instruction",
          value: data?.cleaningInstruction || "-",
        },
      ],
    },
    {
      title: "Cancellation",
      content: [
        {
          label: "Policy",
          value:  data?.cancellationPolicy?
            data?.cancellationPolicy.charAt(0).toUpperCase() +
            data?.cancellationPolicy.slice(1) : "",
        },
        {
          label: "Details",
          value: `This property has a ${data?.cancellationPolicy} cancellation policy.`,
        },
      ],
    },
  ];

  return sections;
};

const formatReservations = (reservations, listingMapId) => {
  if (!reservations || reservations.length === 0)
    return { bookings: [], dateRanges: [] };
  const filteredReservations = reservations?.filter(
    (res) => res?.listingMapId == listingMapId
  );

  const sortedReservations = [...filteredReservations].sort(
    (a, b) => new Date(a.arrivalDate) - new Date(b.arrivalDate)
  );

  const bookings = [];
  const dateRanges = [];

  for (let i = 0; i < sortedReservations.length; i++) {
    const res = sortedReservations[i];
    const nextRes = sortedReservations[i + 1];

    const startDate = new Date(res?.arrivalDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const endDate = new Date(res?.departureDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    bookings.push({
      id: res?.reservationId?.toString(),
      guestName: res?.guestName,
      startDate,
      endDate,
      nights: res?.nights,
      guests: res?.numberOfGuests,
      ...res,
    });
    dateRanges.push(`${startDate} - ${endDate}`);

    if (
      nextRes &&
      new Date(res?.departureDate) < new Date(nextRes?.arrivalDate)
    ) {
      const gapStart = endDate;
      const gapEnd = new Date(nextRes?.arrivalDate).toLocaleDateString(
        "en-US",
        { month: "short", day: "numeric" }
      );

      bookings.push(null);
      dateRanges.push(`${gapStart} - ${gapEnd}`);
    }
  }

  return { bookings, dateRanges };
};

const formatedFAQ = (listings, listingId) => {
  const listing = listings.find((item) => item.id == listingId);
  const faq =
    listing?.customFieldValues?.find(
      (field) => field.customField?.name == "FAQ"
    )?.value || "";

    const nearby =
    listing?.customFieldValues?.find(
      (field) => field?.customField?.name == "Nearby Spots"
    )?.value;
  return { faq, nearby };
};

const updateListings = async (listings, listingId, type, value) => {
  const listing = listings?.find((item) => item.id == listingId);
  const fieldName =
    type === "faq" ? "FAQ" : type === "nearby" ? "Nearby Spots" : null;

  const customFieldId = listing?.customFieldValues.find(
    (item) => item?.customField.name === fieldName
  )?.customField.id;

  const updatedListing = {
    ...listing,
    customFieldValues: [{ customFieldId: customFieldId, value: value }],
  };
  const updatedListings = [ ...listings];
  try {
    const response = await api.post("/hostaway/update-listing", updatedListing);
    if (response?.data?.detail?.response?.result) {
      const data = response?.data?.detail?.response?.result;
      const updatedData = updatedListings?.map((item) =>
        item.id == listingId ? data : item
      );
      toast.success("AI information updated successfully..!")
      return updatedData;
    }
    return updatedListings;
  } catch (error) {
    toast.error("An error occurred while updating AI info");
    console.log("Error at update listings", error);
    return [];
  }
};

export {
  formattedListing,
  getListing,
  formatReservations,
  formatedFAQ,
  updateListings,
  getListingstatus,
};
