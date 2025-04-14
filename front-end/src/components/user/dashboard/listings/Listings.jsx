import { useState, useEffect } from "react";
import Properties from "./Properties";
import { useSelector } from "react-redux";
import { formattedListing, getListingstatus } from "../../../../helpers/ListingsHelper";
import { setReservations } from "../../../../store/reservationSlice";
import { setListings } from "../../../../store/listingSlice";
import { useDispatch } from "react-redux";
import {
  getHostawayReservation,
  getAllListings,
} from "../../../../helpers/Message";
import ListingShimmer from "../../../common/shimmer/ListingShimmer";
import { getHostawayTask } from "../../../../helpers/TaskHelper";
import { setTasks } from "../../../../store/taskSlice";

const Listings = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listingStatus, setListingStatus] = useState([]);
  const dispatch = useDispatch();

  const reservation = useSelector((state) => state.reservations.reservations);
  const listing = useSelector((state) => state.listings.listings);
  const tasks = useSelector((state) => state.tasks.tasks);

  const getReservations = async () => {
    const data = await getHostawayReservation();
    dispatch(setReservations(data));
    return data;
  };

  const getListings = async () => {
    const reservations = await getReservations();
    const data = await getAllListings();
    const listingAIStatus = await getListingstatus();
    const hostawayTask = await getHostawayTask();
    setListingStatus(listingAIStatus);
    setProperties(formattedListing(data, reservations, listingAIStatus, hostawayTask));
    dispatch(setListings(data));
    dispatch(setTasks(hostawayTask));
    setLoading(false);
  };

  useEffect(() => {
    if (listing?.length !== 0 && reservation?.length !== 0 && listingStatus?.length !== 0 && tasks?.length !== 0) {
      setProperties(formattedListing(listing, reservation, listingStatus, tasks));
      setLoading(false);
      return;
    }
    getListings();
  }, []);

  return (
    <>
      {!loading ? <Properties properties={properties} /> : <ListingShimmer />}
    </>
  );
};

export default Listings;
