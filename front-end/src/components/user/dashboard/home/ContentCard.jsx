import { useEffect, useState } from "react";
import DataTable from "./DataTable";
import api from "@/api/api";
import { useDispatch, useSelector } from "react-redux";
import { setListings } from "../../../../store/listingSlice";
import ListingShimmer from "../../../common/shimmer/ContentTable";
import { formattedListing } from "../../../../helpers/ListingsHelper";
import { setReservations } from "../../../../store/reservationSlice";
import {
  getHostawayReservation,
  getAllListings,
} from "../../../../helpers/Message";

const ContentCard = () => {
  const [listings, setListingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const reservation = useSelector((state) => state.reservations.reservations);
  const listing = useSelector((state) => state.listings.listings);

  const tasksData = {
    title: "Recent Tasks",
    filters: ["Project", "Staff", "Status"],
    columns: [
      { key: "name", label: "Name", width: "w-[45%]" },
      { key: "staff", label: "Staff", width: "w-[35%]" },
      { key: "status", label: "Status", width: "w-[20%]" },
    ],
    data: [
      {
        name: "Leaking Faucet in Bathroom 1",
        staff: "Om prakash sao",
        status: "Completed",
      },
      {
        name: "Doorlock not working in Bedroom 2",
        staff: "Neilsan mando",
        status: "Delayed",
      },
      {
        name: "Window lock Broken in Living Room ",
        staff: "Tiruvelly priya",
        status: "At risk",
      },
      {
        name: "Bathroom 1 shower head dripping",
        staff: "Matt Lopez",
        status: "Completed",
      },
    ],
  };

  const listingsData = {
    title: "Listings",
    columns: [
      { key: "property", label: "Property", width: "w-[25%]" },
      { key: "address", label: "Address", width: "w-[50%]" },
      { key: "occupancy", label: "Occupancy", width: "w-[25%]" },
    ],
    data: listings?.slice(0, 5),
  };

  const getReservations = async () => {
    const data = await getHostawayReservation();
    dispatch(setReservations(data));
    return data;
  };

  useEffect(() => {
    if (listing?.length !== 0 && reservation?.length !== 0) {
      setListingData(formattedListing(listing, reservation));
      setLoading(false);
      return;
    }
    const getListings = async () => {
      const reservations = await getReservations();
      const data = await getAllListings();
      setListingData(formattedListing(data, reservations));
      dispatch(setListings(data));
      setLoading(false);
    };
    getListings();
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-1 my-6 px-3 sm:px-0 w-full">
      <div className="lg:mb-0 mb-6">
        <DataTable
          {...tasksData}
          className="xl:w-[570px] lg:w-[320px] 2xl:w-[800px] w-full"
          badgeColumn="status"
          badgeType="status"
        />
      </div>
      {!loading ? (
        <DataTable
          {...listingsData}
          className="w-full"
          badgeColumn="occupancy"
          badgeType="occupancy"
        />
      ) : (
        <ListingShimmer />
      )}
    </div>
  );
};

export default ContentCard;
