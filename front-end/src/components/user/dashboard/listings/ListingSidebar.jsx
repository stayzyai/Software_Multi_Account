const PropertyListingSidebar = ({ setActiveListingSection, activeListingSection }) => {

  const sections = [
    { id: "about", label: "About" },
    { id: "ai-info", label: "AI Info" },
    { id: "booking", label: "Booking" },
    { id: "nearby", label: "Nearby" },
  ]

  return (
    <aside className="bg-[#FCFDFC] border-r border-gray-300 md:w-[181px] h-screen overflow-y-auto fixed mt-[29px] xl:mt-[29px] lg:mt-[35px]">
      <nav className="pt-20 px-8 md:px-14">
        <div className="space-y-6">
          {sections.map((section) => (
            <button
              key={section.id}
              className={`block text-left text-xl md:text-2xl transition-colors duration-200 text-nowrap ${
                activeListingSection === section.id ? "text-[#000] font-light" : "text-[#696969] font-extralight"
              }`}
              onClick={() => setActiveListingSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </div>
      </nav>
    </aside>
  )
}

export default PropertyListingSidebar

