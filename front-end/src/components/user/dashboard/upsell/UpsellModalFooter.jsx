import { Trash2 } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { setUpsellOffer } from "../../../../store/upsellSlice";
import {
  saveUpsell,
  formateUpsell,
  deleteUpsell,
} from "../../../../helpers/Upsellhelpers";
import { toast } from "sonner";

const ModalFooter = ({
  isEditMode,
  setModalOpen,
  existing,
  setUpsell,
  setEditMode,
  setExisting,
  upsellName,
  detectPeriod,
  message,
  upsells,
  discount,
  setUpsellName,
  setDiscount,
  setDetectPeriod,
}) => {
  const upsellOffer = useSelector((state) => state.upsells.upsell);
  const dispatch = useDispatch();

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
      id: isEditMode ? existing?.id : null,
      name: upsellName,
      discount,
      detect_upsell_days: detectPeriod,
      upsell_message: message,
    };
    const response = await saveUpsell(upsellData);
    if (response?.length !== 0) {
      const formattedResponse = formateUpsell([response])[0];
      setUpsell((prevUpsell) => {
        const existingIndex = prevUpsell.findIndex(
          (offer) => offer.id === formattedResponse.id
        );
        if (existingIndex !== -1) {
          const updatedUpsell = [...prevUpsell];
          updatedUpsell[existingIndex] = formattedResponse;
          return updatedUpsell;
        }
        return [...prevUpsell, formattedResponse];
      });
      const existingIndex = upsellOffer.findIndex(
        (offer) => offer.id === response.id
      );
      let updatedUpsellOffer;
      if (existingIndex !== -1) {
        updatedUpsellOffer = upsellOffer.map((offer) =>
          offer.id === response.id ? response : offer
        );
      } else {
        updatedUpsellOffer = [...upsellOffer, response];
      }
      dispatch(setUpsellOffer(updatedUpsellOffer));
    }
    setExisting({});
    setEditMode(false);
    setModalOpen(false);
    setUpsellName("");
    setDiscount("");
    setDetectPeriod("1 days");
  };

  const handleDelete = async () => {
    const id = existing?.id;
    if (!id) return;
    const response = await deleteUpsell(id);
    if (response) {
      const updatedOffers = upsellOffer?.filter((offer) => offer.id !== id);
      const updatedUpsell = upsells?.filter((upsell) => upsell.id !== id);
      dispatch(setUpsellOffer(updatedOffers));
      setUpsell(updatedUpsell);
      setModalOpen(false);
      setExisting({});
      setEditMode(false);
    }
  };

  return (
    <div className="w-[90%] ml-10 md:w-full md:ml-0 flex justify-end gap-2 p-4 border-t">
      {isEditMode && (
        <button
          onClick={handleDelete}
          className="px-3 py-2 flex items-center border rounded-md hover:bg-red-700 bg-red-600 text-white"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </button>
      )}
      <button
        onClick={() => {
          setModalOpen(false);
          setEditMode(false);
        }}
        className="px-3 py-2 border rounded-md hover:bg-gray-200"
      >
        Cancel
      </button>
      <button
        onClick={handleSave}
        className="px-4 py-2 bg-green-800 hover:bg-green-700 text-white rounded-md"
      >
        {isEditMode ? "Update" : "Save"}
      </button>
    </div>
  );
};

export default ModalFooter;
