import { Bed, Bath, Proportions } from "lucide-react";

const PropertyCard = ({ property }) => {
  const {
    name,
    address,
    image,
    beds,
    bathrooms,
    area,
    checkoutDate,
    taskStatus,
  } = property;

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-xl">
      <img src={image} alt={name} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="font-semibold text-xl mb-1">{name}</h3>
        <p className="text-gray-600 text-sm mb-2 border-b pb-1">{address}</p>

        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <Bed className="text-green-700" size={18} />
            <div className="flex items-baseline gap-1">
              <span className="text-base font-medium">{beds}</span>
              <span className="text-gray-500 text-sm">Beds</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Bath className="text-green-700" size={18} />
            <div className="flex items-baseline gap-1">
              <span className="text-base font-medium">{bathrooms}</span>
              <span className="text-gray-500 text-sm">Bathrooms</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Proportions className="text-green-700" size={18} />
            <div className="flex items-baseline gap-1">
              <span className="text-base font-medium">{area}</span>
              <span className="text-gray-500 text-sm">m²</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4">
          <div>
            <p className="text-gray-500 text-sm mb-1">Upcoming checkout</p>
            <p className="text-sm font-medium">{checkoutDate}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Task status</p>
            <span className="text-sm px-3 py-1 bg-green-50 text-green-700 rounded-full">
              {taskStatus}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
