
import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { useEffect } from "react"
import { formatedFAQ } from "../../../../helpers/ListingsHelper"

 const ListingAIInfo = ({ listingId, listings }) =>{
  const [openSection, setOpenSection] = useState(null)
  const [InfoData, setInfoData] = useState([])

  const toggleSection = (id) => {
    setOpenSection(openSection === id ? null : id)
  }

  useEffect(()=>{
    const listing = listings?.find((item)=>item.id == listingId)
    const response = formatedFAQ(listing)
    setInfoData(response)
  },[listings])

  return (
    <div className="w-full space-y-8 md:px-[51px] px-2 md:pt-24 pt-16">
      {InfoData?.map((item) => (
        <div key={item.id} className="rounded-lg border-[0.2px] border-gray-400 overflow-hidden">
          <button
            onClick={() => toggleSection(item.id)}
            className="w-full flex items-center justify-between py-2 text-left md:pr-8 pr-2"
            aria-expanded={openSection === item.id}
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 flex items-center justify-center rounded-full">
              <img src="/icons/faq.png" className="md:w-[86px] md:h-[61px] w-12 h-8"/>
              </div>
              <span className="font-normal text-[#000] md:text-xl text-sm">{item.title}</span>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                openSection === item.id ? "transform" : "-rotate-90"
              }`}
            />
          </button>
          {openSection === item.id && (
            <div className="p-4 bg-white border-t border-gray-300">
              <p>{item.content}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default ListingAIInfo