import CheckInOutDropdown from "./CheckInOutDropdown";
import { useState, useCallback } from "react";
import CheckoutModal from "../../../common/modals/CheckoutModal";
import { checkout, updateAIStatus } from "../../../../helpers/payment";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "sonner";
import { setUser } from "../../../../store/userSlice";

const BookingDetails = ({
  timeDetails,
  bookingDetails,
  setTimeDetails,
  chatInfo,
}) => {
  const dispatch = useDispatch();
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const chatAIenabledList = useSelector((state) => state.user.chat_list);

  const isChatInList = useCallback((chat_list, chatId) => {
    return chat_list.some((chat) => chat.chat_id === chatId);
  }, []);

  const Switch = ({ checked, handleSwitch }) => (
    <label className="inline-flex items-center cursor-pointer">
      <input
        checked={checked}
        onChange={handleSwitch}
        type="checkbox"
        className="sr-only peer"
      />
      <div className="relative w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-0 peer-focus:ring-[#34C759] dark:peer-focus:ring-[#34C759] rounded-full peer dark:bg-white peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-[#34C759] after:content-[''] after:absolute after:top-[1px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-[18px] after:w-[18px] after:transition-all dark:border-[#34C759] peer-checked:bg-[#34C759]"></div>
    </label>
  );

  const handleCheckOut = async () => {
    const chatId = chatInfo[0]["id"];
    const response = await updateAIStatus(chatId);
    const { firstname, lastname, email, role, ai_enable, chat_list } = response;
    dispatch(
      setUser({ firstname, lastname, email, role, ai_enable, chat_list })
    );
    const chatExists = isChatInList(chat_list, chatId);
    if (ai_enable) {
      if (!chatExists) {
        toast.info("Disabled AI for this chat");
      } else {
        toast.success("Enabled AI for this chat");
      }
    } else {
      const checkoutResponse = await checkout(chatId);
      if (checkoutResponse?.detail?.checkout_url) {
        setCheckoutUrl(checkoutResponse.detail.checkout_url);
        setIsCheckoutModalOpen(true);
      }
    }
  };

  return (
    <>
      <div className="pl-6">
        {timeDetails?.map((item, index) => {
          return (
            <div key={index} className="text-lg ml-5 md:ml-0">
              <p className="mb-4 text-gray-500">Check in</p>
              <div className="flex gap-16 xl:gap-[60px] 2xl:gap-[70px] mb-8">
                <div className="flex gap-1 items-center text-nowrap">
                  <p>{item.timeIn.date}</p>{" "}
                </div>
                <CheckInOutDropdown
                  chatInfo={chatInfo}
                  type={"checkIn"}
                  selectedTime={item.timeIn.time}
                  onSelect={(time) =>
                    setTimeDetails((prev) => {
                      const updated = [...prev];
                      updated[index].timeIn.time = time;
                      return updated;
                    })
                  }
                />
              </div>
              <p className="mb-4 text-gray-500">Check out</p>
              <div className="flex gap-16 xl:gap-[60px] 2xl:gap-[70px]">
                <div className="flex gap-2 text-nowrap items-center">
                  <p>{item.timeOut.date}</p>{" "}
                </div>
                <CheckInOutDropdown
                  chatInfo={chatInfo}
                  type={"checkOut"}
                  selectedTime={item.timeOut.time}
                  onSelect={(time) =>
                    setTimeDetails((prev) => {
                      const updated = [...prev];
                      updated[index].timeOut.time = time;
                      return updated;
                    })
                  }
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="pt-10 grid grid-cols-2 text-nowrap xl:gap-6 gap-12 ml-5 md:ml-0 text-lg bg-[#FCFDFC]">
        {bookingDetails?.map((item, index) => (
          <div key={index} className="ml-6">
            <p className="text-gray-500 mb-3">{item.label}</p>
            {item.label === "AI" ? (
              <Switch
                checked={isChatInList(chatAIenabledList, chatInfo[0]["id"])}
                handleSwitch={handleCheckOut}
              />
            ) : (
              <p>{item.value}</p>
            )}
          </div>
        ))}
      </div>
      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        setIsOpen={setIsCheckoutModalOpen}
        checkoutUrl={checkoutUrl}
      />
    </>
  );
};

export default BookingDetails;
