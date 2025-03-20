const ListingInfo = ({ aboutListing }) => {
  return (
    <div className="md:px-10 px-2 py-20 text-[#000000] md:text-xl text-md w-full">
      <div className="space-y-6">
        {aboutListing?.map((section, index) => (
          <div key={section.title}>
            <div className="font-bold my-2">{section.title}</div>
            <div key={index} className="space-y-4">
              {section.title === "Amenities" ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {section?.content[0]?.value !== "Not specified" ? (
                    section?.content[0]?.value?.map((amenity, amenityIndex) => (
                      <span
                        key={amenityIndex}
                        className="bg-gray-50 px-2 py-1 rounded-lg"
                      >
                        {amenity}
                      </span>
                    ))
                  ) : (
                    <p>Not specified</p>
                  )}
                </div>
              ) : (
                section?.content?.map((item, itemIndex) => {
                  if (typeof item === "string") {
                    return <p key={itemIndex}>{item}</p>;
                  }
                  const { label, value } = item;
                  return (
                    <div
                      key={label}
                      className="flex flex-wrap items-start gap-2"
                    >
                      {label && (
                        <span className="min-w-32 font-medium">{label} :</span>
                      )}
                      {Array.isArray(value) ? (
                        <div className="flex flex-wrap gap-2">
                          {value?.map((v, i) => (
                            <div key={i}>{v}</div>
                          ))}
                        </div>
                      ) : (
                        <span>{value}</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            {index < aboutListing.length - 1 && <span className="mt-4" />}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListingInfo;
