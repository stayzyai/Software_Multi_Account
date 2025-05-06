import Header from "../Header";
import CommonTable from "../common/Table";
import ListingShimmer from "../../../common/shimmer/ListingShimmer";

const Properties = ({ properties, loading }) => {
  const columns = ["Name", "Address", "Occupancy", "Issues", "AI"];

  return (
    <>
      <div className="flex flex-col bg-[#FCFDFC]">
        <div className="border border-b border-black">
          <Header title="Listings" />
        </div>
        {loading ? (
          <div className="mt-10">
            <ListingShimmer />
          </div>
        ) : (
          <div className={`mt-[70px]`}>
            <CommonTable properties={properties} columns={columns} />
          </div>
        )}
      </div>
    </>
  );
};

export default Properties;
