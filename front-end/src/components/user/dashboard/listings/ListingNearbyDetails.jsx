
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label"
import api from "@/api/api";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { BeatLoader } from "react-spinners"

const ListingNearbyDetails = ({ listingId, properties })=>{

  const [isGoogleMapsEnabled, setIsGoogleMapsEnabled] = useState(false);
  const [nearBySpots, setNearbySpots] = useState(null)
  const [loading, setLoading] = useState(false)
  const [displayText, setDisplayText] = useState(null);
  const [index, setIndex] = useState(0);
  const [occupancy, setOccupancy] = useState([])
  const listings = useSelector((state)=>state.listings.listings)

  const handleToggle = () => {
    setIsGoogleMapsEnabled((prevState) => !prevState);
  };

  useEffect(()=>{
        const getNearLoc = async () => {
          setLoading(true)
          const listing = listings?.find((item)=>item.id === listingId)
          if(listing?.lat === null && listing?.lat == null){
            toast.error("Owner has not provided the nearby spots")
            setLoading(false)
            return
          }
          const payload = {"lat": listing.lat, "lng": listing.lng
        }
        setDisplayText('')
          const response = await api.post("/user/nearby-places", payload)
          if(response?.data?.results){
            setNearbySpots(response.data.results)
          }
          setLoading(false)
        }
        const property = properties?.find((item)=>item.id === listingId)
        setOccupancy(property?.occupancy)
        if(isGoogleMapsEnabled){
          getNearLoc()
        }
  },[isGoogleMapsEnabled])

  useEffect(() => {
    if (index < nearBySpots?.length) {
      const timer = setTimeout(() => {
        setDisplayText((prev) => prev + nearBySpots[index]);
        setIndex((prev) => prev + 1);
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [index, nearBySpots]);

  const Switch = () => (
    <label className="inline-flex items-center cursor-pointer">
      <input checked={isGoogleMapsEnabled} onChange={handleToggle} type="checkbox" className="sr-only peer"/>
      <div className="relative w-12 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-0 peer-focus:ring-[#34C759] dark:peer-focus:ring-[#34C759] rounded-full peer dark:bg-white peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-[#34C759] after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-[24px] after:w-[22px] after:transition-all dark:border-[#34C759] peer-checked:bg-[#34C759]"></div>
    </label>
  );

    return(
        <div className="w-full md:pl-11 pr-5 pt-16">
        <div className="flex flex-col">
          <div className={`lg:flex justify-end w-full font-normal md:text-xl text-md pb-4 lg:pb-0 ${occupancy !== "Vacant" ? "text-[#2D8062]" : "text-red-600" }`}>Current Status : {occupancy}</div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center space-x-4 mb-10 z-10">
                <Label htmlFor="maps-toggle" className="text-xl lg:text-2xl font-normal">
                  Google Maps
                </Label>
                <Switch />
            </div>
          </div>
            <div className="space-y-5">
            <h2 className="text-xl lg:text-2xl font-normal">Info</h2>
              <div className="text-xl lg:text-2xl py-12 px-5 bg-[#F8F8F8] rounded-2xl border border-gray-300 border-solid min-h-[341px]">
                {loading ? <div><BeatLoader size={12}/></div> : <span className="md:text-lg text-sm">{displayText}</span>}
              </div>
          </div>
        </div>
      </div>
    )
}

export default ListingNearbyDetails