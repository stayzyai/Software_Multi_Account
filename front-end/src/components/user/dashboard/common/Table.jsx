import { useNavigate } from "react-router-dom";

const CommonTable = ({
  properties,
  columns,
  setOpenListingDetails,
  setOpenListingName,
}) => {

  const navigate = useNavigate()
  const handleClick = (name, id) => {
    setOpenListingName(getFirstTwoWords(name))
    setOpenListingDetails(true)
    navigate(`/user/listing/${id}`)
  };

  const getFirstTwoWords = (name)=>{
    const words = name?.split(' ');
    const firstTwoWords = words?.slice(0, 2).join(' ');
    return firstTwoWords
  }

  const getInitials = (name) => {
    let words = name.trim().split(" ").slice(0, 1);
    return words
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase();
  };

  return (
    <div className="overflow-x-auto px-4 pt-16 md:pl-10 md:pr-4 w-full">
      <div className="sm:min-w-full border-[0.5px] border-[#D1D1D1] rounded-xl min-h-[380px] min-w-fit mb-16">
        <table
          className="lg:text-sm text-xs mb-10"
          style={{ width: "-webkit-fill-available" }}
        >
          <thead>
            <tr className="text-[#222222] border-b-[1px] border-[#D6D8DB]">
              {columns?.map((item, index) => (
                <th key={index} className={`md:py-5 py-2 p-1 ${ item === "" ? "text-right w-12 lg:w-auto" : item === "Address" || item === "Occupancy" ? "text-left" :"text-center" }`}>
                  {item === "" ? (
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded-md border-2 border-gray-300 cursor-pointer appearance-none checked:bg-blue-500 checked:border-transparent checked:relative checked:before:content-['✔'] checked:before:absolute checked:before:text-white checked:before:left-1/2 checked:before:top-1/2 checked:before:transform checked:before:-translate-x-1/2 checked:before:-translate-y-1/2 focus:outline-none bg-white"
                    />
                  ) : (
                    item
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {properties?.map((property, index) => (
              <tr
                key={index}
                className="md:py-5 p-1 border-b-[1px] border-[#D1D1D1] cursor-pointer hover:bg-gray-50 active:bg-gray-100"
              >
                {/* <td className="md:py-4 lg:pl-3 xl:pl-0 p-1 pl-4 text-right">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded-md border-2 border-gray-300 cursor-pointer appearance-none checked:bg-blue-500 checked:border-transparent checked:relative checked:before:content-['✔'] checked:before:absolute checked:before:text-white checked:before:left-1/2 checked:before:top-1/2 checked:before:transform checked:before:-translate-x-1/2 checked:before:-translate-y-1/2 focus:outline-none bg-white"
                  />
                </td> */}
                <td onClick={() => handleClick(property.property, property.id)} className="flex items-center space-x-2 md:py-2 p-1 md:w-54 w-[220px] md:px-6 px-8">
                  {property.image ? (
                    <div className="w-9 h-9 rounded-full">
                      <img src={property.image} alt="Property Image" className="w-full h-full object-cover"/>
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-red-900 flex items-center justify-center text-lg text-white font-semibold">
                      <p>{getInitials(property?.property)}</p>
                    </div>
                  )}
                  <span>{getFirstTwoWords(property.property)}</span>
                </td>
                <td className="text-left">{property.address}</td>
                <td>
                  <span
                    className={`px-3 py-1 rounded-3xl ${
                      property.occupancy === "Occupied"
                        ? "bg-green-50 text-green-600"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {property.occupancy}
                  </span>
                </td>
                <td className="md:py-2 p-1 text-center">{property.issues}</td>
                <td className="md:py-2 p-1 text-center">{property.ai}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CommonTable;
