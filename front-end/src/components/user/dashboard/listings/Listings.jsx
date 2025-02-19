import { useState, useEffect } from "react";
import Properties from "./Properties";
import ListingDetails from "./ListingDetails";
import { useSelector } from "react-redux";
import { formattedListing } from "../../../../helpers/ListingsHelper";
import { setReservations } from "../../../../store/reservationSlice";
import { setListings } from "../../../../store/listingSlice";
import { useDispatch } from "react-redux";
import api from "@/api/api";

const Listings = () => {
  const [openListingDetails, setOpenListingDetails] = useState(false);
  const [openListingName, setOpenListingName] = useState("");
  const [listingId, setListingId] = useState(null);
  const [properties, setProperties] = useState([]);
  const dispatch = useDispatch();

  const listings = useSelector((state) => state.listings.listings);
  const reservations = useSelector((state) => state.reservations.reservations);
  const reservation = useSelector((state) => state.reservations.reservations);
  const listing = useSelector((state) => state.listings.listings);

  const getReservations = async () => {
    try {
      const response = await api.get("/hostaway/get-all/reservations");
      if (response?.data?.detail?.data?.result) {
        const data = response?.data?.detail?.data?.result;
        dispatch(setReservations(data));
        return data;
      }
    } catch (error) {
      console.log("Error at get conversation: ", error);
    }
  };

  useEffect(() => {
    if (listing?.length !== 0 && reservation?.length !== 0) {
      setProperties(formattedListing(listing, reservation));
      return;
    }
    const getListings = async () => {
      const reservations = await getReservations();
      try {
        const response = await api.get("/hostaway/get-all/listings");
        if (response?.data?.detail?.data?.result) {
          const data = response?.data?.detail?.data?.result;
          setProperties(formattedListing(data, reservations));
          dispatch(setListings(data));
        }
      } catch (error) {
        console.log("Error at get listings: ", error);
      }
    };
    getListings();
  }, []);

  useEffect(() => {
    setProperties(formattedListing(listings, reservations));
  }, [reservations, listings]);

  return (
    <>
      {openListingDetails ? (
        <ListingDetails
          setOpenListingDetails={setOpenListingDetails}
          openListingName={openListingName}
          openListingDetails={openListingDetails}
          listingId={listingId}
          properties={properties}
        />
      ) : (
        <Properties
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
