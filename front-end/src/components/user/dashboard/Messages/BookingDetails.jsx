import CheckInOutDropdown from "./CheckInOutDropdown";
import { useState, useCallback } from "react";
import CheckoutModal from "../../../common/modals/CheckoutModal";
import { checkout, updateAIStatus } from "../../../../helpers/payment";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "sonner";
import { setUser } from "../../../../store/userSlice";
import { useEffect } from "react";
import {getAllListings} from "../../../../helpers/Message"

const BookingDetails = ({
  timeDetails,
  bookingDetails,
  setTimeDetails,
  chatInfo,
  sentimentLoading
}) => {
  const dispatch = useDispatch();
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [isConfirm, setIsConfirm] = useState(false);
  const chatAIenabledList = useSelector((state) => state.user.chat_list);
  const [listingCount, setListingsCount] = useState(null)
  const isChatInList = useCallback((chat_list, chatId) => {
    // return chat_list.some((chat) => chat.chat_id === chatId);
    return chat_list.some(item => item.chat_id === chatId && item.ai_enabled === true);
  }, []);

  const fetchListings = async()=>{
    const data = await getAllListings()
    setListingsCount(data?.length ?? 1)
  }

  useEffect(()=>{
    fetchListings()
  },[])

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
      setIsCheckoutModalOpen(false);
      if (!chatExists) {
        toast.info("Disabled AI for this chat");
      } else {
        toast.success("Enabled AI for this chat");
      }
    } else {
      const checkoutResponse = await checkout(chatId, listingCount);
      setIsCheckoutModalOpen(true);
      if (checkoutResponse?.detail?.checkout_url) {
        setCheckoutUrl(checkoutResponse.detail.checkout_url);
        setIsConfirm(false);
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
                checked={isChatInList(
                  chatAIenabledList,
                  chatInfo[0]["id"],
                )}
                handleSwitch={handleCheckOut}
              />
            ) : (
              <p>{item.value}</p>
            )}
          </div>
        ))}
      </div>
      <p className="text-gray-500 ml-4 mt-10">Sentiment</p>
      {!sentimentLoading ? (
        chatInfo[0]["icon"] && chatInfo[0]["summary"] ? (
          <div>
            <img
              src={chatInfo[0]["icon"]}
              width={30}
              height={30}
              alt="sentiment emoji"
              className="text-xs ml-4 my-1"
            />
            <p className="text-md text-wrap ml-4 mt-1">
              {chatInfo[0]["summary"] || "No summary available"}
            </p>
          </div>
        ) : (
          <div>
            <p className="m-4 bg-gray-200 font-semibold border-2 w-10 h-10 justify-center flex items-center rounded-full p-1"></p>
            <p className="text-md text-wrap ml-4 mt-1">No summary available</p>
          </div>
        )
      ) : (
        <div className="animate-pulse space-y-2 pt-2 ml-4">
          <div className="h-11 w-11 bg-gray-300 rounded-full" />
          <div className="h-7 w-11/12 bg-gray-300 px-4 rounded" />
        </div>
      )}

      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        isConfirm={isConfirm}
        setIsConfirm={setIsConfirm}
        handleCheckOut={handleCheckOut}
        setIsOpen={setIsCheckoutModalOpen}
        checkoutUrl={checkoutUrl}
      />
    </>
  );
};

export default BookingDetails;
