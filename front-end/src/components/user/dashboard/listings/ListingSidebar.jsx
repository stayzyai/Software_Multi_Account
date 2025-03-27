const PropertyListingSidebar = ({ setActiveListingSection, activeListingSection }) => {

  const sections = [
    { id: "about", label: "About" },
    { id: "ai-info", label: "AI Info" },
    { id: "booking", label: "Booking" },
    { id: "nearby", label: "Nearby" },
  ]

  return (
    <aside className="bg-[#FCFDFC] border-r border-gray-300 md:w-[181px] w-20 h-screen overflow-y-auto fixed mt-[25px] lg:mt-[25px]">
      <nav className="pt-16 px-3 md:px-14">
        <div className="space-y-6">
          {sections.map((section) => (
            <button
              key={section.id}
              className={`block text-left text-base md:text-2xl transition-colors duration-200 text-nowrap ${
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

