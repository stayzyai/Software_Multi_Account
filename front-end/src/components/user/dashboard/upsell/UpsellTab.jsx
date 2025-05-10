import { useState, useEffect } from "react";
import Header from "../Header";
import UpsellManagement from "./UpsellList";
import CreateUpsellModal from "./UpsellModal";
import { getUpsell, formateUpsell } from "../../../../helpers/Upsellhelpers";
import { setUpsellOffer } from "../../../../store/upsellSlice";
import { useDispatch } from "react-redux";

const UpsellTab = () => {
  const [isOpen, setModalOpen] = useState(false);
  const [upsell, setUpsell] = useState([]);
  const [isEditMode, setEditMode] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchUpsell = async () => {
      const data = await getUpsell();
      dispatch(setUpsellOffer(data));
      setUpsell(formateUpsell(data));
    };
    fetchUpsell();
  }, []);

  return (
    <div>
      <Header title={"Upsells"} />
      <UpsellManagement
        upsells={upsell}
        setUpsell={setUpsell}
        setModalOpen={setModalOpen}
        isOpen={isOpen}
        setEditMode={setEditMode}
        isEditMode={isEditMode}
      />
      {!isEditMode && <CreateUpsellModal
        setModalOpen={setModalOpen}
        isOpen={isOpen}
        isEditMode={isEditMode}
        setEditMode={setEditMode}
        setUpsell={setUpsell}
        upsells={upsell}
      />}
    </div>
  );
};
export default UpsellTab;
