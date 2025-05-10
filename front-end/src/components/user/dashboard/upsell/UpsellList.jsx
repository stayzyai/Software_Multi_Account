import { setUpsellOffer } from "../../../../store/upsellSlice";
import { useSelector, useDispatch } from "react-redux";
import { updateUpsellStatus } from "../../../../helpers/Upsellhelpers";
import { toast } from "sonner";
import { useState } from "react";
import CreateUpsellModal from "./UpsellModal";

const UpsellManagement = ({
  isOpen,
  setModalOpen,
  upsells,
  setUpsell,
  setEditMode,
  isEditMode,
}) => {
  const [showUpsell, setShowUpsell] = useState({});

  const upsellOffer = useSelector((state) => state.upsells.upsell);
  const dispatch = useDispatch();

  const toggleUpsell = async (id, enabled) => {
    const response = await updateUpsellStatus(id, enabled);
    if (!response) {
      toast.error("An error occurred. Unable to update the status.");
      return;
    }
    setUpsell(
      upsells.map((upsell) =>
        upsell.id === id ? { ...upsell, enabled: !upsell.enabled } : upsell
      )
    );
    dispatch(
      setUpsellOffer(
        upsellOffer.map((upsell) =>
          upsell.id === id ? { ...upsell, enabled: !upsell.enabled } : upsell
        )
      )
    );
  };

  const handleClickUpsell = (id) => {
    setEditMode(!isEditMode);
    const data = upsells.find((item) => item.id === id) || {};
    setShowUpsell(data);
    setModalOpen(true);
  };

  return (
    <div className="mt-28 px-4 md:px-10 pb-10">
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setModalOpen(!isOpen)}
          className="bg-[#2D8062] hover:bg-green-800 text-white px-3 py-2 md:px-5 md:py-3 rounded-xl md:rounded-2xl flex items-center gap-1 md:gap-2 text-sm md:text-base transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 md:h-5 md:w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          New Upsell
        </button>
      </div>

      <div className="space-y-4 md:space-y-5 text-[#060606]">
        {upsells?.length !== 0 ? (
          <>
            {upsells?.map((upsell) => (
              <div
                key={upsell.id}
                className="border-[0.3px] border-gray-400 rounded-xl md:rounded-2xl p-3 md:p-4 px-4 md:px-20 flex items-center"
              >
                <div
                  onClick={() => handleClickUpsell(upsell.id)}
                  className="w-full flex flex-col md:flex-row md:justify-between cursor-pointer"
                >
                  <div className="font-normal text-[#060606] text-lg md:text-xl md:w-1/3 mb-2 md:mb-0">
                    {upsell.name}
                  </div>
                  <div className="text-sm md:text-base md:w-1/3 mb-2 md:mb-0">
                  {upsell.timing} before {upsell?.name.includes("Early") || upsell?.name.includes("Pre") ? "check-in" : "check-out"}
                  </div>
                  <div className="w-full md:w-1/3 flex justify-between items-center">
                    <span className="text-sm md:text-base">
                      {upsell.discount}
                    </span>
                    <button
                      className={`relative inline-flex h-5 md:h-6 w-10 md:w-11 items-center rounded-full transition-colors ${
                        upsell.enabled ? "bg-[#34C759]" : "bg-gray-200"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleUpsell(upsell.id, upsell.enabled);
                      }}
                    >
                      <span
                        className={`inline-block h-4 md:h-5 w-4 md:w-5 transform rounded-full bg-white transition-transform ${
                          upsell.enabled
                            ? "translate-x-5 md:translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="w-full flex justify-center text-lg md:text-xl text-gray-400">
            No upsells found
          </div>
        )}
      </div>
      {isEditMode && (
        <CreateUpsellModal
          showUpsell={showUpsell}
          setModalOpen={setModalOpen}
          isOpen={isOpen}
          isEditMode={isEditMode}
          setEditMode={setEditMode}
          upsells={upsells}
          setUpsell={setUpsell}
        />
      )}
    </div>
  );
};

export default UpsellManagement;
