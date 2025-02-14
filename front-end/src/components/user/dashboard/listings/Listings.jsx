import { useState, useEffect } from "react";
import Properties from "./Properties";
import ListingDetails from "./ListingDetails";
import { useSelector } from "react-redux";
import { formattedListing } from "../../../../helpers/ListingsHelper"

const Listings = ({ toggleSidebar }) => {
  const [openListingDetails, setOpenListingDetails] = useState(false);
  const [openListingName, setOpenListingName] = useState("")
  const [listingId, setListingId] = useState(null)
  const [properties, setProperties] = useState([])

  const listings = useSelector((state) => state.listings.listings);
  const reservations = useSelector((state) => state.reservations.reservations);

  useEffect(()=>{
    setProperties(formattedListing(listings, reservations))
  },[reservations, listings])

  return (
    <>
      {openListingDetails ? (
        <ListingDetails
          toggleSidebar={toggleSidebar}
          setOpenListingDetails={setOpenListingDetails}
          openListingName={openListingName}
          openListingDetails={openListingDetails}
          listingId={listingId}
          properties={properties}
        />
      ) : (
        <Properties
          toggleSidebar={toggleSidebar}
          setOpenListingDetails={setOpenListingDetails}
          setOpenListingName={setOpenListingName}
          setListingId={setListingId}
          properties={properties}
        />
      )}
    </>
  );
};

export default Listings;
