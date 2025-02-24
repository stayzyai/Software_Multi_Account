import Header from "../Header";
import CommonTable from "../common/Table";
import ListingShimmer from "../../../common/shimmer/ListingShimmer";

const Properties = ({ properties}) => {

  const columns = ["Name", "Address", "Occupancy", "Issues", "AI"];

  return (
    <>
      <div className="flex flex-col bg-[#FCFDFC]">
        <div className="border border-b border-black">
          <Header title="Listings" />
        </div>
        <div className={`${properties?.length !== 0 ? "mt-[70px]" : "mt-[40px]"}`}>
          {properties?.length !== 0 ? <CommonTable
            properties={properties}
            columns={columns}
          />:<ListingShimmer/>}
        </div>
      </div>
    </>
  );
};

export default Properties;
