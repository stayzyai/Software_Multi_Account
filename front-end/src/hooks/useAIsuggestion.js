import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { openAISuggestion, formatedMessages } from "../helpers/Message";
import { setIssueStatus, setTaskId, setSuggestion, setDetectReservationId } from "../store/notificationSlice";
import {getReservationsGap} from "../helpers/Message"
import { useEffect, useState } from "react";

const useAISuggestion = (setInput, chatInfo, amenity, tasks, setIsAISuggestion) => {

  const dispatch = useDispatch();
  const users = useSelector((state) => state.hostawayUser.users);
  const listings = useSelector((state) => state.listings.listings);
  const userProfile = useSelector((state) => state.user);
  const allReservations = useSelector((state) => state.reservations.reservations);
  const [reservationGaps, setReservationGaps] = useState([])
  const [startReservationDate, setStartReservationDate] = useState("")
  const [stayingGuest, setStayingGuest] = useState({})

  useEffect(()=>{
    const listingMapId = chatInfo[0]["listingMapId"];
    const reservationId = chatInfo[0]["reservationId"];
    const { dateRanges, reservationStartDate } = getReservationsGap(allReservations, listingMapId, listings)
    setReservationGaps(dateRanges)
    setStartReservationDate(reservationStartDate)
    const reservation = allReservations?.find((item)=>item.id == reservationId)
    setStayingGuest(reservation)
  }, [allReservations, listings])

  const handleAISuggestion = async (messages) => {
    if(!userProfile?.ai_enable){
      toast.info("Upgrade your plan to unlock AI-powered responses. To upgrade, simply toggle the AI button")
      return
    }

    if (!chatInfo || chatInfo.length === 0) return;

    dispatch(setSuggestion(true));
    setIsAISuggestion(true);
    const listingMapId = chatInfo[0]["listingMapId"];
    const reservationId = chatInfo[0]["reservationId"];
    const chatId = chatInfo[0]["id"];
    const listing = listings?.find((item) => item.id === listingMapId);
    const listingsName = listing?.name;
    
    // Filter reservations for the current listing
    const listingReservations = allReservations.filter(
      (reservation) => reservation.listingMapId == listingMapId
    );
    
    // Pass the reservations to the formatedMessages function
    const { systemPrompt, lastUserMessage } = formatedMessages(messages, listing, amenity, reservationGaps, startReservationDate, stayingGuest, listingReservations);
    if(lastUserMessage === undefined) {
      toast.info("A response can only be generated after the guest has sent at least one message.");
      setIsAISuggestion(false);
      return;
    }
    const payload = { prompt: systemPrompt, messsages: lastUserMessage, listingMapId: listingMapId, listingsName: listingsName, reservationId: reservationId };
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
    dispatch(setDetectReservationId(reservationId))

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
