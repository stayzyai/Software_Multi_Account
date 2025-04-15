import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { openAISuggestion, formatedMessages } from "../helpers/Message";
import { setIssueStatus, setTaskId, setSuggestion } from "../store/notificationSlice";

const useAISuggestion = (setInput, chatInfo, amenity, tasks, setIsAISuggestion) => {

  const dispatch = useDispatch();
  const users = useSelector((state) => state.hostawayUser.users);
  const listings = useSelector((state) => state.listings.listings);

  const handleAISuggestion = async (messages) => {
    if (!chatInfo || chatInfo.length === 0) return;

    dispatch(setSuggestion(true));
    setIsAISuggestion(true);
    const listingMapId = chatInfo[0]["listingMapId"];
    const reservationId = chatInfo[0]["reservationId"];
    const chatId = chatInfo[0]["id"];
    const listing = listings?.find((item) => item.id === listingMapId);
    const listingsName = listing?.name;
    const { systemPrompt, lastUserMessage } = formatedMessages(messages, listing, amenity);
    if(lastUserMessage === undefined) {
      toast.info("A response can only be generated after the guest has sent at least one message.");
      setIsAISuggestion(false);
      return;
    }
    const payload = { prompt: systemPrompt, messsages: lastUserMessage, listingMapId: listingMapId, listingsName: listingsName };
    const { response, taskId } = await openAISuggestion(
      payload,
      listingMapId,
      reservationId,
      users,
      setIssueStatus,
      tasks,
      dispatch
    );
    dispatch(setTaskId(taskId));
    dispatch(setSuggestion(false));

    if (response) {
      setInput((prev) => ({ ...prev, [chatId]: response }));
      setIsAISuggestion(false);
    } else {
      toast.error("Some error occurred. Please try again");
      setIsAISuggestion(false);
    }
  };

  return { handleAISuggestion};
};

export default useAISuggestion;
