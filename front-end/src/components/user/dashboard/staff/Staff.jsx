const Staff = ({ columns, staffs }) => {
  const getFirstLetter = (name) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="overflow-x-auto px-4 pt-32 md:pl-10 md:pr-4 w-full">
      <div className="sm:min-w-full border-[0.5px] border-[#D1D1D1] rounded-xl min-h-40 min-w-fit mb-6">
        <table
          className="lg:text-sm text-xs w-full mb-12"
        >
          <thead>
            <tr className="text-[#222222] border-b-[1px] border-[#D6D8DB]">
              {columns?.map((item, index) => (
                <th key={index} className={`md:py-5 py-3 ${item === "Name" && "text-left"} ${item === "" ? "w-1" : "xl:w-1/3"}`}>
                  {item}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staffs?.map((staff, index) => (
              <tr
                key={index}
                className="md:py-5 lg:p-1 border-b-[1px] border-[#D1D1D1] cursor-pointer text-sm"
              >
                <td className="w-12 py-2 flex justify-end items-center">
                {staff?.profile === "" ? (
                      <div
                        className={`w-8 h-8 flex justify-center items-center font-extrabold text-xl text-white rounded-full bg-green-800`}
                      >
                        {getFirstLetter(staff?.firstName)}
                      </div>
                    ) : (
                      <img
                        src={staff?.profile}
                        alt="profile"
                        className="w-10 h-10 rounded-full object-contain"
                      />
                    )}
                </td>
                <td className="text-center px-2">
                  <div className="py-1 flex items-center gap-2">
                    <p>{staff?.firstName}</p>
                    <p>{staff?.lastName}</p>
                  </div>
                </td>
                <td className="md:py-2 p-1 text-center px-3">{staff?.email}</td>
                <td className="md:py-2 p-1 text-center text-nowrap px-3">
                  {staff.phone}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Staff;
