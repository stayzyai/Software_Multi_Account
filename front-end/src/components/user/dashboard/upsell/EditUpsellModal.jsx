import { useState, useRef, useEffect } from "react";
import { XIcon } from "lucide-react";
import RenderPreview from "./MessagePreview";
import UpsellMessages from "./UpsellMessages";
import DetectUpsell from "./DetectUpsell";
import { saveUpsell, deleteUpsell } from "../../../../helpers/Upsellhelpers";
import { toast } from "sonner";

const EditUpsellModal = ({ setModalOpen, isOpen, showUpsell }) => {
  const [existing, setExisting] = useState({})
  const [upsellName, setUpsellName] = useState("");
  const [discount, setDiscount] = useState("");
  const [detectPeriod, setDetectPeriod] = useState("1 days");
  const [message, setMessage] = useState("Hi {guest_name}, your stay is coming up soon! We'd like to offer you a {discount} off your stay if you book an additional night. Let me know if you're interested!");
  const [isEditMode, setEditMode] = useState(false)
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);
  const [variablesDropdownOpen, setVariablesDropdownOpen] = useState(false);

  const variablesDropdownRef = useRef(null);
  const periodDropdownRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (showUpsell) {
      setExisting(showUpsell)
      setEditMode(true);
      setUpsellName(showUpsell.name || "");
      setDiscount(showUpsell.discount || "");
      setDetectPeriod(showUpsell.timing || "1 days");
      setMessage(showUpsell.message || "");
    } 

    function handleClickOutside(event) {
      if (periodDropdownRef.current && !periodDropdownRef.current.contains(event.target)) {
        setPeriodDropdownOpen(false);
      }
      if (variablesDropdownRef.current && !variablesDropdownRef.current.contains(event.target)) {
        setVariablesDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSave = async () => {
    if (upsellName.trim().length === 0) {
      toast.error("Upsell name cannot be empty");
      return;
    }
    if (discount.trim().length === 0) {
      toast.error("Discount cannot be empty");
      return;
    }
    const upsellData = {
      name: upsellName,
      discount,
      detect_upsell_days: detectPeriod,
      upsell_message: message,
    };

    try {
      if (isEditMode) {
        await updateUpsell(showUpsell.id, upsellData);
        toast.success("Upsell updated successfully");
      } else {
        await saveUpsell(upsellData);
        toast.success("Upsell created successfully");
      }
      setModalOpen(false);
    } catch (error) {
      toast.error("Failed to save upsell");
    }
  };

  const handleDelete = async () => {
    if (!showUpsell?.id) return;

    try {
      await deleteUpsell(showUpsell.id);
      toast.success("Upsell deleted successfully");
      setModalOpen(false);
    } catch (error) {
      toast.error("Failed to delete upsell");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-0 flex items-center md:left-[35%] z-40 font-inter">
      <div className="bg-[#FCFDFC] rounded-lg shadow-lg w-full max-w-[600px] max-h-[650px] overflow-y-scroll scrollbar-hide mx-4 border border-gray-400">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-md font-semibold">Edit Upsell</h2>
          <button
            onClick={() => setModalOpen(false)}
            className="text-gray-500 hover:text-gray-700 rounded-full p-1"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="relative">
            <span className="my-2 text-sm">Enter name</span>
            <input
              id="upsell-name"
              placeholder="Enter upsell name"
              value={upsellName}
              onChange={(e) => setUpsellName(e.target.value)}
              className="w-full text-sm border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-200 resize-none scrollbar-hide"
            />
            <div className="mt-3">
              <p className="text-sm pb-1">Upsell discount</p>
              <input
                type="text"
                id="upsell-offer"
                placeholder="Enter discount offer"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full text-sm border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-200 resize-none scrollbar-hide"
              />
            </div>
          </div>
          <DetectUpsell
            detectPeriod={detectPeriod}
            periodDropdownRef={periodDropdownRef}
            periodDropdownOpen={periodDropdownOpen}
            setPeriodDropdownOpen={setPeriodDropdownOpen}
            setDetectPeriod={setDetectPeriod}
          />
          <UpsellMessages
            variablesDropdownRef={variablesDropdownRef}
            variablesDropdownOpen={variablesDropdownOpen}
            message={message}
            setMessage={setMessage}
            setVariablesDropdownOpen={setVariablesDropdownOpen}
            textareaRef={textareaRef}
          />
          <div className="space-y-2">
            <label className="text-sm font-semibold">Message Preview</label>
            <div className="bg-white border border-gray-300 rounded-md p-4 break-words">
              <RenderPreview message={message} />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t">
          {isEditMode && (
            <button
              onClick={handleDelete}
              className="px-3 py-2 border rounded-md hover:bg-red-700 bg-red-600 text-white"
            >
              Delete
            </button>
          )}
          <button
            onClick={() => {setModalOpen(false); setEditMode(false)}}
            className="px-3 py-2 border rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-800 hover:bg-green-700 text-white rounded-md"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditUpsellModal;
