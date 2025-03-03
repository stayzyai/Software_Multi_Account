import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import { formatedFAQ, updateListings} from "../../../../helpers/ListingsHelper";
import { useDispatch } from "react-redux";
import { setListings } from "../../../../store/listingSlice";

const ListingAdditionalInfo = ({ listings, listingId }) => {
  const dispatch = useDispatch();
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

  return (
    <div className="w-full px-10 mx-auto p-4 mt-8">
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
              className="w-full min-h-[200px] p-6 text-base bg-gray-100 rounded-3xl focus:outline-none resize-none"
            />
            <div className="flex justify-end gap-4 p-4">
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
          <div className="bg-gray-100 rounded-3xl p-6 min-h-[200px]">
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
      <div className="mb-10">
        <div className="flex justify-between items-center mb-5">
          <h1 className="font-medium text-xl">Nearby Spots</h1>
        </div>

        {editMode.nearby ? (
          <div className="rounded-lg overflow-hidden">
            <textarea
              value={tempValues.nearby}
              onChange={(e) => handleChange(e, "nearby")}
              placeholder="Enter nearby attractions information"
              className="w-full min-h-[200px] p-6 text-base bg-gray-100 rounded-3xl focus:outline-none resize-none"
            />
            <div className="flex justify-end gap-4 p-4">
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
          <div className="bg-gray-100 rounded-3xl p-6 min-h-[200px]">
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
      </div>
    </div>
  );
};

export default ListingAdditionalInfo;
