import { useState, useEffect } from "react";
import Properties from "./Properties";
import { useSelector } from "react-redux";
import { formattedListing } from "../../../../helpers/ListingsHelper";
import { setReservations } from "../../../../store/reservationSlice";
import { setListings } from "../../../../store/listingSlice";
import { useDispatch } from "react-redux";
import {
  getHostawayReservation,
  getAllListings,
} from "../../../../helpers/Message";
import ListingShimmer from "../../../common/shimmer/ListingShimmer";

const Listings = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  const listings = useSelector((state) => state.listings.listings);
  const reservation = useSelector((state) => state.reservations.reservations);
  const listing = useSelector((state) => state.listings.listings);

  const getReservations = async () => {
    const data = await getHostawayReservation();
    dispatch(setReservations(data));
    return data;
  };

  const getListings = async () => {
    const reservations = await getReservations();
    const data = await getAllListings();
    setProperties(formattedListing(data, reservations));
    dispatch(setListings(data));
    setLoading(false);
  };

  useEffect(() => {
    if (listing?.length !== 0 && reservation?.length !== 0) {
      setProperties(formattedListing(listing, reservation));
      setLoading(false);
      return;
    }
    getListings();
  }, []);

  useEffect(() => {
    setProperties(formattedListing(listings, reservation));
  }, [reservation, listings]);

  return (
    <>
      {!loading ? <Properties properties={properties} /> : <ListingShimmer />}
    </>
  );
};

export default Listings;
