import { useState, useEffect } from "react";
import PropertyListingSidebar from "./ListingSidebar";
import Header from "../Header";
import ListingInfo from "./ListingAbout";
import ListingAdditionalInfo from "./ListingAdditionInfo";
import ListingBookingDetails from "./ListingBooking";
import ListingNearbyDetails from "./ListingNearbyDetails";
import { useSelector, useDispatch } from "react-redux";
import { getListing, formatReservations} from "../../../../helpers/ListingsHelper";
import { setListings } from "../../../../store/listingSlice";
import { setReservations } from "../../../../store/reservationSlice";
import { useParams } from "react-router-dom";
import { getHostawayReservation, getAllListings} from "../../../../helpers/Message"

const ListingDetails = ({
  openListingName,
  openListingDetails,
  properties,
  setOpenListingDetails,
}) => {
  const listings = useSelector((state) => state.listings.listings);
  const reservation = useSelector((state) => state.reservations.reservations);
  const [activeListingSection, setActiveListingSection] = useState("about");
  const [aboutListing, setAboutListing] = useState([]);
  const [calenderDetails, setCalenderDetails] = useState({});
  const { listingId } = useParams();
  const dispatch = useDispatch();

  const getReservations = async () => {
    const data = await getHostawayReservation()
    dispatch(setReservations(data));
    return data;
  };

  const getListings = async () => {
    const reservations = await getReservations();
    const data = await getAllListings()
    dispatch(setListings(data));
    const listing = data?.find((item) => item.id == listingId);
    const ListingData = getListing(listing);
    const { bookings, dateRanges } = formatReservations(reservations, listingId);
    setCalenderDetails({
      bookings: bookings,
      dateRanges: dateRanges,
    });
    setAboutListing(ListingData);
  };

  useEffect(() => {
    if (listings?.length !== 0 && reservation?.length !== 0) {
      const listing = listings?.find((item) => item.id == listingId);
      const data = getListing(listing);
      const { bookings, dateRanges } = formatReservations(
        reservation,
        listingId
      );
      setCalenderDetails({
        bookings: bookings,
        dateRanges: dateRanges,
      });
      setAboutListing(data);
      return;
    }
    getListings();
  }, [listingId]);

  return (
    <>
      <Header
        title={"Listings"}
        openListingDetails={openListingDetails}
        openListingName={openListingName}
        // setOpenListingDetails={setOpenListingDetails}
        setOpenListingDetails={setOpenListingDetails}
      />
      <div className="flex pt-[54px]">
        <div>
          <PropertyListingSidebar
            setActiveListingSection={setActiveListingSection}
            activeListingSection={activeListingSection}
          />
        </div>
        <div className="lg:ml-48 sm:ml-44 ml-20 w-full mb-6">
          {activeListingSection === "about" && (
            <ListingInfo aboutListing={aboutListing} />
          )}
          {activeListingSection === "ai-info" && (
            <ListingAdditionalInfo listings={listings} listingId={listingId} />
          )}
          {activeListingSection === "booking" && (
            <ListingBookingDetails calenderDetails={calenderDetails} />
          )}
          {activeListingSection === "nearby" && (
            <ListingNearbyDetails
              listingId={listingId}
              properties={properties}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default ListingDetails;
