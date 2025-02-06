const ListingInfo = ({aboutListing}) => {


  return (
    <div className="px-10 py-20 text-[#000000] text-xl w-full">
      <div className="space-y-6">
        {aboutListing?.map((section, index) => (
          <div key={section.title}>
            <div className="font-bold my-2">{section.title}</div>
            <div key={index} className="space-y-4">
              {section?.content?.map((item, itemIndex) => {
                if (typeof item === "string") {
                  return <p key={itemIndex}>{item}</p>;
                }
                const { label, value } = item;
                return (
                  <div key={label} className="flex flex-wrap items-start gap-2">
                    {label && <span className="min-w-32 font-medium">{label} :</span>}
                    {Array.isArray(value) ? (
                      <div className="flex flex-wrap gap-2">
                        {value.map((v, i) => (
                          <div key={i}>
                            {v}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span>{value}</span>
                    )}
                  </div>
                );
              })}
            </div>
            {index < aboutListing.length - 1 && <span className="mt-4" />}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListingInfo;
