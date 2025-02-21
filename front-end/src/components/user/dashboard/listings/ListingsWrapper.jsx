import { useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import ListingDetails from "./ListingDetails";
import { setListings } from "../../../../store/listingSlice";
import { useState, useEffect } from "react";
import { setReservations } from "../../../../store/reservationSlice"
import { formattedListing } from "../../../../helpers//ListingsHelper";
import api from "@/api/api";
import PropertyDetailsShimmer from "../../../common/shimmer/ListingDetails"

const ListingsWraper = () => {
  const [openListingDetails, setOpenListingDetails] = useState(false);
  const [openListingName, setOpenListingName] = useState("");
  const [properties, setProperties] = useState([]);
  const { listingId } = useParams();
  const reservations = useSelector((state) => state.reservations.reservations);
  const listings = useSelector((state) => state.listings.listings);

  const dispatch = useDispatch();

  const getReservations = async () => {
    try {
      const response = await api.get("/hostaway/get-all/reservations");
      if (response?.data?.detail?.data?.result) {
        const data = response?.data?.detail?.data?.result;
        dispatch(setReservations(data));
        return data;
      }
    } catch (error) {
      console.log("Error at get reservations: ", error);
    }
  };

  useEffect(() => {
    if (listings?.length !== 0 && reservations?.length !== 0) {
      const listing = listings?.find((item)=>item.id == listingId)
      const twoWords = listing?.name?.split(" ").slice(0, 2).join(" ");
      setOpenListingName(twoWords)
      setProperties(formattedListing(listings, reservations));
      setOpenListingDetails(true)
      return;
    }
    const getListings = async () => {
      const reservations = await getReservations();
      try {
        const response = await api.get("/hostaway/get-all/listings");
        if (response?.data?.detail?.data?.result) {
          const data = response?.data?.detail?.data?.result;
          const listing = data?.find((item)=>item.id == listingId)
          const twoWords = listing?.name?.split(" ").slice(0, 2).join(" ");
          setOpenListingName(twoWords)
          setOpenListingDetails(true)
          setProperties(formattedListing(data, reservations));
          dispatch(setListings(data));
        }
      } catch (error) {
        console.log("Error at get listings: ", error);
      }
    };
    getListings();
  }, [listingId]);

  useEffect(() => {
    setProperties(formattedListing(listings, reservations));
  }, [reservations, listings]);

  return properties?.length !== 0 ? (
    <ListingDetails
      openListingName={openListingName}
      // listingId={listingId}
      properties={properties}
      openListingDetails={openListingDetails}
      setOpenListingDetails={setOpenListingDetails}
    />
  ):(<PropertyDetailsShimmer/>);
};

export default ListingsWraper;
