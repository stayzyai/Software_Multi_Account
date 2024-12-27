import DataTable from "./DataTable";

const ContentCard = () => {
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
        name: "Window lock Broken in Living Room",
        staff: "Tiruvelly priya",
        status: "At risk",
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
    data: [
      {
        property: "Sunset Haven",
        address: "123 Beachfront Blvd, Malibu, CA 90265",
        occupancy: "Occupied",
      },
      {
        property: "Mountain Retreat",
        address: "456 Alpine Way, Aspen, CO 81611",
        occupancy: "Vacant",
      },
    ],
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-2">
      <div className="lg:mb-0 mb-6">
        <DataTable
          {...tasksData}
          className="xl:w-[720px] lg:w-[360px]"
          badgeColumn="status"
          badgeType="status"
        />
      </div>
      <DataTable
        {...listingsData}
        className="w-full"
        badgeColumn="occupancy"
        badgeType="occupancy"
      />
    </div>
  );
};

export default ContentCard;
