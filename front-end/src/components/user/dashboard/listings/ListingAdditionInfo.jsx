import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import { formatedFAQ, updateListings} from "../../../../helpers/ListingsHelper";
import { useDispatch, useSelector } from "react-redux";
import { setListings } from "../../../../store/listingSlice";
import { updatePropertyAIStatus } from "../../../../store/userSlice";
import { toast } from "sonner";

const ListingAdditionalInfo = ({ listings, listingId }) => {
  const dispatch = useDispatch();
  const userProfile = useSelector((state) => state.user);
  const [loading, setLoading] = useState({
    faq: false,
    nearby: false,
  });

  const [FAQ, setFAQ] = useState({
    faq: "",
    nearby: "",
  });
  const [editMode, setEditMode] = useState({
    faq: false,
    nearby: false,
  });
  const [tempValues, setTempValues] = useState({
    faq: "",
    nearby: "",
  });

  useEffect(() => {
    const data = formatedFAQ(listings, listingId);
    setFAQ(data);
    setTempValues(data);
  }, []);

  const handleEdit = (type) => {
    setEditMode((prev) => ({
      ...prev,
      [type]: true,
    }));
    setTempValues((prev) => ({
      ...prev,
      [type]: FAQ[type],
    }));
  };

  const handleChange = (e, type) => {
    setTempValues((prev) => ({
      ...prev,
      [type]: e.target.value,
    }));
  };

  const handleSave = async (type) => {
    setLoading((prev) => ({ ...prev, [type]: true }));
    const data = await updateListings(
      listings,
      listingId,
      type,
      tempValues[type]
    );
    dispatch(setListings(data));
    setLoading((prev) => ({
      ...prev,
      [type]: false,
    }));
    setFAQ((prev) => ({
      ...prev,
      [type]: tempValues[type],
    }));
    setEditMode((prev) => ({
      ...prev,
      [type]: false,
    }));
  };

  const handleCancel = (type) => {
    setEditMode((prev) => ({
      ...prev,
      [type]: false,
    }));
    setTempValues((prev) => ({
      ...prev,
      [type]: FAQ[type],
    }));
  };

  // Property AI toggle functionality
  const isPropertyAIEnabled = (propertyId) => {
    // First check if master AI is enabled
    if (!userProfile.master_ai_enabled) {
      return false;
    }
    
    // If master AI is enabled, check property-specific setting
    const propertyStatus = userProfile.property_ai_status?.[propertyId];
    return propertyStatus?.ai_enabled ?? true; // Default to enabled if not set
  };

  const handlePropertyAIToggle = () => {
    // Check if master AI is disabled
    if (!userProfile.master_ai_enabled) {
      toast.error("Enable Master AI in Settings to control property AI");
      return;
    }
    
    const currentStatus = isPropertyAIEnabled(listingId);
    const newStatus = !currentStatus;
    
    dispatch(updatePropertyAIStatus({
      propertyId: listingId,
      ai_enabled: newStatus
    }));
    
    toast.success(
      newStatus 
        ? "Property AI features enabled for all chats" 
        : "Property AI features disabled for all chats"
    );
  };

  // Switch component for property AI toggle
  const PropertyAISwitch = () => {
    const isDisabled = !userProfile.master_ai_enabled;
    return (
      <label className={`inline-flex items-center ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
        <input
          checked={isPropertyAIEnabled(listingId)}
          onChange={isDisabled ? undefined : handlePropertyAIToggle}
          type="checkbox"
          disabled={isDisabled}
          className="sr-only peer"
        />
        <div className={`relative w-12 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-0 peer-focus:ring-[#34C759] dark:peer-focus:ring-[#34C759] rounded-full peer dark:bg-white peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-[#34C759] after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-[24px] after:w-[22px] after:transition-all dark:border-[#34C759] peer-checked:bg-[#34C759] ${isDisabled ? 'opacity-50' : ''}`}></div>
      </label>
    );
  };

  return (
    <div className="w-full px-1 md:px-10 mx-auto p-4 mt-8 overflow-hidden md:overflow-auto">
      {/* Property AI Control Section */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-5">
          <h1 className="font-medium text-xl">Property AI Control</h1>
        </div>
        <div className="bg-gray-100 rounded-3xl p-6 min-h-[120px] w-full">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium mb-2">AI Features for This Property</h3>
              <p className="text-gray-600 text-sm">
                {isPropertyAIEnabled(listingId) 
                  ? "AI features are enabled for all chats in this property" 
                  : "AI features are disabled for all chats in this property"
                }
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium">
                {isPropertyAIEnabled(listingId) ? "Enabled" : "Disabled"}
              </span>
              <PropertyAISwitch />
            </div>
          </div>
          {!userProfile.master_ai_enabled && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700">
                <span className="font-medium">Master AI is disabled.</span> Enable Master AI in Settings to control property AI features.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mb-10">
        <div className="flex justify-between items-center mb-5">
          <h1 className="font-medium text-xl">FAQ</h1>
        </div>

        {editMode.faq ? (
          <div className="rounded-lg overflow-hidden">
            <textarea
              value={tempValues.faq}
              onChange={(e) => handleChange(e, "faq")}
              placeholder="Enter FAQ information"
              className={`w-[88%] md:w-full min-h-[200px] p-6 text-base bg-gray-100 rounded-3xl focus:outline-none resize-none`}
            />
            <div className="w-[90%] md:w-full ml-2 flex justify-end gap-4 p-4">
              <button disabled={loading.faq}
                onClick={() => handleSave("faq")}
                className="bg-[#2D8062] hover:bg-emerald-600 text-white px-6 py-2 rounded-[20px] font-normal text-xl border border-black"
              >
                {loading.faq ? "Updating..." :"Save"}
              </button>
              <button disabled={loading.faq}
                onClick={() => handleCancel("faq")}
                className={`bg-[#D24040] hover:bg-red-600 text-white px-6 py-2 rounded-[20px] font-normal text-xl border border-black`}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className={` bg-gray-100 rounded-3xl p-6 min-h-[200px] ${editMode.nearby ? "w-[88%] md:w-full" :"w-[100%] md:w-full"}`}>
            <div className="w-full flex justify-end">
              {!editMode.faq && (
                <button
                  onClick={() => handleEdit("faq")}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Pencil size={16} />
                </button>
              )}
            </div>
            {FAQ.faq ? (
              <div dangerouslySetInnerHTML={{ __html: FAQ.faq }} />
            ) : (
              <p className="text-gray-500">
                Text that owner inputs for AI to know about the property
              </p>
            )}
          </div>
        )}
      </div>
      {/* <div className="mb-10">
        <div className="flex justify-between items-center mb-5">
          <h1 className="font-medium text-xl">Nearby Spots</h1>
        </div>

        {editMode.nearby ? (
          <div className="rounded-lg overflow-hidden">
            <textarea
              value={tempValues.nearby}
              onChange={(e) => handleChange(e, "nearby")}
              placeholder="Enter nearby attractions information"
              className={`w-[88%] md:w-full min-h-[200px] p-6 text-base bg-gray-100 rounded-3xl focus:outline-none resize-none}`}
            />
            <div className="w-[90%] md:w-full ml-2 flex justify-end gap-4 p-4">
              <button disabled={loading.nearby}
                onClick={() => handleSave("nearby")}
                className="bg-[#2D8062] hover:bg-emerald-600 text-white px-6 py-2 rounded-[20px] font-normal text-xl border border-black"
              >
                {loading.nearby ? "Updating.." : "Save"}
              </button>
              <button disabled={loading.nearby}
                onClick={() => handleCancel("nearby")}
                className="bg-[#D24040] hover:bg-red-600 text-white px-6 py-2 rounded-[20px] font-normal text-xl border border-black"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className={`bg-gray-100 rounded-3xl p-6 min-h-[200px] ${editMode.faq ? "w-[88%] md:w-full" :"w-[100%] sm:w-[100%] md:w-full"}`}>
            <div className="w-full flex justify-end">
              {!editMode.nearby && (
                <button
                  onClick={() => handleEdit("nearby")}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Pencil size={16} />
                </button>
              )}
            </div>
            {FAQ.nearby ? (
              <div dangerouslySetInnerHTML={{ __html: FAQ.nearby }} />
            ) : (
              <p className="text-gray-500">
                Text that owner inputs for AI to know about the property
              </p>
            )}
          </div>
        )}
      </div> */}
    </div>
  );
};

export default ListingAdditionalInfo;
