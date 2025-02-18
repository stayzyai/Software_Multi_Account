import { useState, useEffect } from "react";
import PropertyListingSidebar from "./ListingSidebar";
import Header from "../Header";
import ListingInfo from "./ListingAbout";
import ListingAIInfo from "./ListingAIInfo";
import ListingBookingDetails from "./ListingBooking";
import ListingNearbyDetails from "./ListingNearbyDetails";
import { useSelector } from "react-redux";
import { getListing, formatReservations } from "../../../../helpers/ListingsHelper";

const ListingDetails = ({ toggleSidebar, openListingName,
openListingDetails, setOpenListingDetails, listingId, properties }) => {

  const listings = useSelector((state)=>state.listings.listings)
  const reservation = useSelector((state)=>state.reservations.reservations)
  const [activeListingSection, setActiveListingSection] = useState("about");
  const [aboutListing, setAboutListing] = useState([])
  const [calenderDetails, setCalenderDetails] = useState({})

  useEffect(()=>{
      const listing = listings?.find((item)=>item.id === listingId)
      const data = getListing(listing)
      const { bookings, dateRanges } = formatReservations(reservation, listingId)
      setCalenderDetails({
        bookings: bookings, dateRanges: dateRanges
      })
      setAboutListing(data)
  },[])

  return (
    <>
      <Header
        title={"Listings"}
        toggleSidebar={toggleSidebar}
        openListingDetails={openListingDetails}
        openListingName={openListingName}
        setOpenListingDetails={setOpenListingDetails}
      />
      <div className="flex pt-[54px]">
        <div>
          <PropertyListingSidebar
            setActiveListingSection={setActiveListingSection}
            activeListingSection={activeListingSection}
          />
        </div>
        <div className="lg:ml-48 sm:ml-44 ml-36 w-full mb-6">
          {activeListingSection === "about" && <ListingInfo aboutListing={aboutListing} />}
          {activeListingSection === "ai-info" && <ListingAIInfo listingId={listingId} />}
          {activeListingSection === "booking" && <ListingBookingDetails calenderDetails={calenderDetails} />}
          {activeListingSection === "nearby" && <ListingNearbyDetails  listingId={listingId} properties={properties}/>}
        </div>
      </div>
    </>
  );
};

export default ListingDetails;
