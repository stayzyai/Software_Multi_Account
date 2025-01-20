import { Building2, Users, Clock, UserCheck } from "lucide-react";
import Header from "../Header";
// import StatsCard from "./StatsCard";
import FilterBar from "./FilterBar";
import PropertyCard from "./PropertyCard";

const Properties = ({ toggleSidebar }) => {
  const stats = [
    {
      icon: {
        component: <Building2 className="text-purple-500" size={24} />,
        bgColor: "bg-purple-100",
      },
      value: 42,
      label: "Total properties",
    },
    {
      icon: {
        component: <Users className="text-orange-500" size={24} />,
        bgColor: "bg-orange-100",
      },
      value: 95,
      label: "Occupancy Rate",
      suffix: "/100",
    },
    {
      icon: {
        component: <Clock className="text-blue-500" size={24} />,
        bgColor: "bg-blue-100",
      },
      value: 1022,
      label: "Avg Stay",
      suffix: "/1300 Hrs",
    },
    {
      icon: {
        component: <UserCheck className="text-yellow-500" size={24} />,
        bgColor: "bg-yellow-100",
      },
      value: 101,
      label: "Cleaners Assigned",
      suffix: "/120",
    },
  ];

  const properties = [
    {
      name: "Palm Harbor",
      address: "2699 Green Valley, Highland Lake, FL",
      image: "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg",
      beds: 3,
      bathrooms: 2,
      area: "5x7",
      checkoutDate: "6/23/24",
      taskStatus: "Assigned",
    },
    {
      name: "Palm Harbor",
      address: "2699 Green Valley, Highland Lake, FL",
      image: "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg",
      beds: 3,
      bathrooms: 2,
      area: "5x7",
      checkoutDate: "6/23/24",
      taskStatus: "Assigned",
    },
    {
      name: "Palm Harbor",
      address: "2699 Green Valley, Highland Lake, FL",
      image: "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg",
      beds: 3,
      bathrooms: 2,
      area: "5x7",
      checkoutDate: "6/23/24",
      taskStatus: "Assigned",
    },
    {
      name: "Palm Harbor",
      address: "2699 Green Valley, Highland Lake, FL",
      image: "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg",
      beds: 3,
      bathrooms: 2,
      area: "5x7",
      checkoutDate: "6/23/24",
      taskStatus: "Assigned",
    },
    {
      name: "Palm Harbor",
      address: "2699 Green Valley, Highland Lake, FL",
      image: "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg",
      beds: 3,
      bathrooms: 2,
      area: "5x7",
      checkoutDate: "6/23/24",
      taskStatus: "Assigned",
    },
    {
      name: "Palm Harbor",
      address: "2699 Green Valley, Highland Lake, FL",
      image: "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg",
      beds: 3,
      bathrooms: 2,
      area: "5x7",
      checkoutDate: "6/23/24",
      taskStatus: "Assigned",
    },
    // Add more properties as needed
  ];

  return (
    <div className="flex flex-col bg-[#FCFDFC]">
      <Header title="Listings" toggleSidebar={toggleSidebar} />
      <div className="mt-12">
        <div className="border-b-[.5px] border-black">
          <FilterBar
            onSearch={(value) => console.log("Search:", value)}
            onFilter={() => console.log("Filter clicked")}
            onSort={() => console.log("Sort clicked")}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 px-7 py-6">
          {properties.map((property, index) => (
            <PropertyCard key={index} property={property} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Properties;
