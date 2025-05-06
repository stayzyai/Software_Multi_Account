import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import api from "@/api/api";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { BeatLoader } from "react-spinners";
import {
  formatedFAQ,
  updateListings,
} from "../../../../helpers/ListingsHelper";
import { setListings } from "../../../../store/listingSlice";

const ListingNearbyDetails = ({ listingId, properties }) => {
  const [isGoogleMapsEnabled, setIsGoogleMapsEnabled] = useState(false);
  const [nearBySpots, setNearbySpots] = useState(null);
  const [loading, setLoading] = useState(false);
  const [displayText, setDisplayText] = useState(null);
  const [index, setIndex] = useState(0);
  const [occupancy, setOccupancy] = useState([]);
  const [edit, setEdit] = useState(false);
  const [updateloader, setUpdateLoader] = useState(false);
  const listings = useSelector((state) => state.listings.listings);
  const dispatch = useDispatch();

  const handleToggle = () => {
    setIsGoogleMapsEnabled((prevState) => !prevState);
  };

  useEffect(() => {
    const getNearLoc = async () => {
      setLoading(true);
      setDisplayText(null);
      setNearbySpots(null);
      setIndex(0);
      const listing = listings?.find((item) => item.id == listingId);
      if (listing?.lat === null && listing?.lat == null) {
        toast.error("Owner has not provided the nearby spots");
        setLoading(false);
        return;
      }
      const payload = { lat: listing.lat, lng: listing.lng };
      setDisplayText("");
      const response = await api.post("/user/nearby-places", payload);
      if (response?.data?.results) {
        setNearbySpots(response.data.results);
      }
      setLoading(false);
    };
    const property = properties?.find((item) => item.id == listingId);
    setOccupancy(property?.occupancy);
    if (isGoogleMapsEnabled) {
      getNearLoc();
    }
  }, [isGoogleMapsEnabled, listingId, listings, properties]);

  useEffect(() => {
    if (nearBySpots && index < nearBySpots.length) {
      const timer = setTimeout(() => {
        setDisplayText((prev) => prev + nearBySpots[index]);
        setIndex((prev) => prev + 1);
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [index, nearBySpots]);

  useEffect(() => {
    const { nearby } = formatedFAQ(listings, listingId);
    setDisplayText(nearby);
  }, []);

  const handleChange = (e) => {
    setDisplayText(e.target.value);
  };

  const handleSave = async () => {
    setUpdateLoader(true);
    const type = "nearby";
    const data = await updateListings(listings, listingId, type, displayText);
    setUpdateLoader(false);
    dispatch(setListings(data));
  };

  const Switch = () => (
    <label className="inline-flex items-center cursor-pointer">
      <input
        checked={isGoogleMapsEnabled}
        onChange={handleToggle}
        type="checkbox"
        className="sr-only peer"
      />
      <div className="relative w-12 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-0 peer-focus:ring-[#34C759] dark:peer-focus:ring-[#34C759] rounded-full peer dark:bg-white peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-[#34C759] after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-[24px] after:w-[22px] after:transition-all dark:border-[#34C759] peer-checked:bg-[#34C759]"></div>
    </label>
  );

  return (
    <div className="w-full md:pl-11 pr-5 pt-16">
      <div className="flex flex-col ml-3 md:ml-0">
        <div
          className={`lg:flex justify-end w-full font-normal md:text-xl text-md pb-4 lg:pb-0 ${
            occupancy !== "Vacant" ? "text-[#2D8062]" : "text-red-600"
          }`}
        >
          Current Status : {occupancy}
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-4 mb-10 z-10">
            <Label
              htmlFor="maps-toggle"
              className="text-xl lg:text-2xl font-normal"
            >
              Google Maps
            </Label>
            <Switch />
          </div>
        </div>
        <div className="space-y-5">
          <h2 className="text-xl lg:text-2xl font-normal">Nearby spot</h2>
          {edit && (
            <div className="rounded-lg overflow-hidden">
              {loading && <BeatLoader />}
              <textarea
                value={displayText}
                onChange={handleChange}
                placeholder="Enter nearby attractions information"
                className={`w-[88%] md:w-full min-h-[200px] p-6 text-base bg-gray-100 rounded-3xl focus:outline-none resize-none}`}
              />
              <div className="w-[90%] md:w-full ml-2 flex justify-end gap-4 p-4">
                <button
                  disabled={loading}
                  onClick={handleSave}
                  className="bg-[#2D8062] hover:bg-emerald-600 text-white px-6 py-2 rounded-[20px] font-normal text-xl border border-black"
                >
                  {updateloader ? "Updating.." : "Save"}
                </button>
                <button
                  disabled={loading}
                  onClick={() => setEdit(false)}
                  className="bg-[#D24040] hover:bg-red-600 text-white px-6 py-2 rounded-[20px] font-normal text-xl border border-black"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {!edit && (
            <div
              className={`bg-gray-100 rounded-3xl p-6 min-h-[200px] ${
                edit ? "w-[88%] md:w-full" : "w-[100%] sm:w-[100%] md:w-full"
              }`}
            >
              <div className="w-full flex justify-end">
                <button
                  onClick={() => setEdit(true)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Pencil size={16} />
                </button>
              </div>
              {loading && <BeatLoader/>}
              {displayText ? (
                <div dangerouslySetInnerHTML={{ __html: displayText }} />
              ) : (
                <p className="text-gray-500">
                  Text that owner inputs for AI to know about the property
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListingNearbyDetails;
