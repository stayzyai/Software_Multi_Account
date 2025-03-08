import api from "@/api/api";
import { toast } from "sonner";

const saveUpsell = async (payload) => {
  try {
    const response = await api.post("/hostaway/create-upsell", payload);
    if (response?.status == 200) {
      toast.success("Upsell offer created successfully!");
      const data  = response?.data?.data
      return data;
    }
    toast.error("Something went wrong. Please try again.");
    return response;
  } catch (error) {
    console.log("Error at save upsell data", error);
    return [];
  }
};

const getUpsell = async () => {
  try {
    const response = await api.get("/hostaway/get-upsell");
    if (response?.status == 200) {
      return response?.data?.data;
    }
    return [];
  } catch (error) {
    console.log("Error at get all upsell", error);
    return [];
  }
};

const formateUpsell = (data) => {
  const outputData = data.map((item) => ({
    id: item.id,
    name: item.name,
    timing: `${item.detect_upsell_days}`,
    discount: `${item.discount}% off`,
    enabled: item.enabled,
    message: item.upsell_message
  }));
  return outputData;
};

const updateUpsellStatus = async (id, enabled) => {
  const payload = { upsell_id: id, enabled: !enabled };
  try {
    const response = await api.post("/hostaway/update-upsell-status", payload);

    if (response.status == 200) {
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error updating upsell status:", error.message);
    return false;
  }
};

const deleteUpsell = async (id) => {
  try {
    const response = await api.delete(`/hostaway/delete-upsell/${id}`);
    if (response?.status == 200) {
      toast.success("Upsell offer deleted successfully!");
      return true;
    }
    toast.error("Something went wrong. Please try again.");
    return false;
  } catch (error) {
    console.log("Error at delete upsell data", error);
    return false
  }
};

export { saveUpsell, getUpsell, formateUpsell, updateUpsellStatus, deleteUpsell };
