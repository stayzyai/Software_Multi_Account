import CheckInOutDropdown from "./CheckInOutDropdown";
import { useState, useCallback } from "react";
// Payment components removed - not needed
import { useSelector, useDispatch } from "react-redux";
import { toast } from "sonner";
import { setUser } from "../../../../store/userSlice";
import { useEffect } from "react";
import { triggerAICatchup } from "../../../../api/api";
import {getAllListings} from "../../../../helpers/Message"
import { useNavigate } from "react-router-dom";

const BookingDetails = ({
  timeDetails,
  bookingDetails,
  setTimeDetails,
  chatInfo,
  sentimentLoading
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // Payment functionality removed - not needed
  const [isConfirm, setIsConfirm] = useState(false);
  const chatAIenabledList = useSelector((state) => state.user.chat_list);
  const userProfile = useSelector((state) => state.user);
  const [listingCount, setListingsCount] = useState(null)
  const isChatInList = useCallback((chat_list, chatId) => {
    // First check if master AI is enabled
    if (!userProfile.master_ai_enabled) {
      return false;
    }
    
    // Then check if property AI is enabled
    const propertyId = chatInfo[0]?.listingMapId;
    if (propertyId) {
      const propertyStatus = userProfile.property_ai_status?.[propertyId];
      const isPropertyAIEnabled = propertyStatus?.ai_enabled ?? true; // Default to enabled
      
      // If property AI is disabled, chat AI is also disabled regardless of individual setting
      if (!isPropertyAIEnabled) {
        return false;
      }
    }
    
    // If both master and property AI are enabled, check individual chat setting
    const chatExists = chat_list.some(item => item.chat_id === chatId);
    if (!chatExists) return true; // Default enabled when both master and property AI are on
    return chat_list.some(item => item.chat_id === chatId && item.ai_enabled === true);
  }, [userProfile.master_ai_enabled, userProfile.property_ai_status, chatInfo]);

  // Check if chat toggle should be disabled (when master AI or property AI is off)
  const isChatToggleDisabled = useCallback(() => {
    // If master AI is disabled, chat toggle is disabled
    if (!userProfile.master_ai_enabled) {
      return true;
    }
    
    // If master AI is enabled, check property AI
    const propertyId = chatInfo[0]?.listingMapId;
    if (propertyId) {
      const propertyStatus = userProfile.property_ai_status?.[propertyId];
      const isPropertyAIEnabled = propertyStatus?.ai_enabled ?? true; // Default to enabled
      return !isPropertyAIEnabled;
    }
    return false;
  }, [userProfile.master_ai_enabled, userProfile.property_ai_status, chatInfo]);

  const fetchListings = async()=>{
    const data = await getAllListings()
    setListingsCount(data?.length ?? 1)
  }

  useEffect(()=>{
    fetchListings()
  },[])

  // Handle property link click
  const handlePropertyClick = (propertyId) => {
    if (propertyId) {
      navigate(`/user/listing/${propertyId}`);
    }
  };

  const Switch = ({ checked, handleSwitch, disabled = false }) => (
    <label className={`inline-flex items-center ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
      <input
        checked={checked}
        onChange={disabled ? undefined : handleSwitch}
        type="checkbox"
        disabled={disabled}
        className="sr-only peer"
      />
      <div className={`relative w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-0 peer-focus:ring-[#34C759] dark:peer-focus:ring-[#34C759] rounded-full peer dark:bg-white peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-[#34C759] after:content-[''] after:absolute after:top-[1px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-[18px] after:w-[18px] after:transition-all dark:border-[#34C759] ${disabled ? 'peer-checked:bg-gray-400' : 'peer-checked:bg-[#34C759]'}`}></div>
    </label>
  );

  const handleAIToggle = async () => {
    // Check if property AI is disabled first
    if (isChatToggleDisabled()) {
      toast.warning("Cannot toggle chat AI - Property AI is disabled. Enable property AI first.");
      return;
    }

    const chatId = chatInfo[0]["id"];
    const isCurrentlyEnabled = isChatInList(chatAIenabledList, chatId);
    
    try {
      // Toggle AI status for this specific chat
      let updatedChatList = [...chatAIenabledList];
      
      // If chat doesn't exist in list, add it with disabled state (since default is enabled)
      if (!chatAIenabledList.some(chat => chat.chat_id === chatId)) {
        updatedChatList.push({
          chat_id: chatId,
          ai_enabled: false, // Explicitly disabled when user toggles off
          features: {
            auto_response: false,
            maintenance_detection: false,
            sentiment_analysis: false,
            upsell_detection: false
          }
        });
      } else {
        // Toggle existing chat
        updatedChatList = updatedChatList.map(chat => 
          chat.chat_id === chatId 
            ? { ...chat, ai_enabled: !isCurrentlyEnabled }
            : chat
        );
      }
      
      // Update user state with new chat list
      dispatch(setUser({
        ...userProfile,
        chat_list: updatedChatList
      }));
      
      // Show appropriate message and trigger catchup if enabling AI
      if (!isCurrentlyEnabled) {
        toast.success("AI enabled for this chat");
        
        // Trigger AI catchup for unanswered messages
        try {
          console.log("🔄 Triggering AI catchup for chat:", chatId);
          const catchupResult = await triggerAICatchup(chatId);
          
          if (catchupResult?.detail?.data?.sent_responses > 0) {
            toast.info(`AI caught up and sent ${catchupResult.detail.data.sent_responses} response(s) to recent messages`);
          } else if (catchupResult?.detail?.data?.processed_conversations > 0) {
            console.log("✅ AI catchup completed - no responses needed");
          }
        } catch (error) {
          console.error("❌ AI catchup failed:", error);
          // Don't show error to user as the main toggle still worked
        }
      } else {
        toast.info("AI disabled for this chat");
      }
      
    } catch (error) {
      console.error("Error toggling AI:", error);
      toast.error("Failed to toggle AI status");
    }
  };

  return (
    <>
      {/* Property Name Section - Moved to Top */}
      <div className="pl-6 mb-4">
        {bookingDetails?.find(item => item.label === "Property") && (
          <div className="ml-5 md:ml-0">
            <p className="text-gray-500 mb-1 text-lg">Property</p>
            <div className="flex flex-col">
              <button
                onClick={() => handlePropertyClick(bookingDetails.find(item => item.label === "Property")?.propertyId)}
                className="text-blue-600 hover:text-blue-800 hover:underline text-left font-medium break-words max-w-full text-lg"
                title="Click to view property details"
              >
                {bookingDetails.find(item => item.label === "Property")?.value}
              </button>
              <span className="text-xs text-gray-400 mt-1">Click to view details</span>
            </div>
          </div>
        )}
      </div>

      {/* Check-in/Check-out Times */}
      <div className="pl-6">
        {timeDetails?.map((item, index) => {
          return (
            <div key={index} className="text-lg ml-5 md:ml-0">
              <p className="mb-2 text-gray-500">Check in</p>
              <div className="flex gap-16 xl:gap-[60px] 2xl:gap-[70px] mb-6">
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
              <p className="mb-2 text-gray-500">Check out</p>
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
      <div className="pt-4 grid grid-cols-2 text-nowrap xl:gap-6 gap-12 ml-5 md:ml-0 text-lg bg-[#FCFDFC]">
        {bookingDetails?.filter(item => item.label !== "Property" && item.label !== "AI").map((item, index) => (
          <div key={index} className="ml-6">
            <p className="text-gray-500 mb-1">{item.label}</p>
            <p>{item.value}</p>
          </div>
        ))}
      </div>
      
      {/* AI Section - Separate */}
      <div className="pt-4 ml-5 md:ml-0 text-lg bg-[#FCFDFC]">
        <div className="ml-6">
          <p className="text-gray-500 mb-1">AI</p>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <Switch
                checked={isChatInList(
                  chatAIenabledList,
                  chatInfo[0]["id"],
                )}
                handleSwitch={handleAIToggle}
                disabled={isChatToggleDisabled()}
              />
              {isChatToggleDisabled() && (
                <span className="text-xs text-gray-500 italic">
                  {!userProfile.master_ai_enabled ? "(Controlled by Master AI)" : "(Controlled by Property)"}
                </span>
              )}
            </div>
            {isChatToggleDisabled() && (
              <p className="text-xs text-amber-600 mt-1">
                {!userProfile.master_ai_enabled 
                  ? "Enable Master AI in Settings to control this chat"
                  : "Enable Property AI to control this chat"
                }
              </p>
            )}
          </div>
        </div>
      </div>
      <p className="text-gray-500 ml-4 mt-6">Sentiment</p>
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

      {/* CheckoutModal removed - payment functionality not needed */}
    </>
  );
};

export default BookingDetails;
