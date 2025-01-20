import { getApi } from "@/API/api";
import { SYSTEM_PROMPT } from "@/constant/prompt";

const getListDetails = async (listId: string, apiKey: string) => {
  try {
    const response = await getApi(`/hostaway/get-details/listings/${listId}`, null, apiKey);

    if (response?.detail?.data?.status == "success") {
      return response?.detail?.data?.result;
    }
    return null;
  } catch (error) {
    console.log("Error at get list details", error);
    return null;
  }
};

const getPrompt = async (conversation: any[], listDetails: any) => {
  // const listDetails =""
  let latestMessages =
    conversation.length > 0
      ? conversation.filter((message) => message.user)
      : [];
  latestMessages =
    latestMessages.length > 0 ? latestMessages[latestMessages.length - 1] : {};
  const previousConversation = conversation
    .slice(0, -1)
    .map((msg) => JSON.stringify(msg))
    .join(",");

  latestMessages = Object.values(latestMessages);
  const prompt = SYSTEM_PROMPT.replace(
    /{previous_conversation}/g,
    previousConversation
  )
    .replace(/{latest_message}/g, JSON.stringify(latestMessages))
    .replace(/{property_details}/g, JSON.stringify(listDetails));

  return { prompt, latestMessages };
};

const getAllMessages = (mess: NodeListOf<Element>) => {
  let messageArray: any[] = [];
  try {
    if (mess.length > 0) {
      const maxLength = mess.length;

      for (let i = 0; i < maxLength; i++) {
        const messageElement = mess[i] as HTMLElement;
        const rawText = messageElement.innerText;
        const cleanedText = rawText
          .replace(
            /\d{2} \w+ \d{2} \d{2}:\d{2}\s+\(browser time\)\s+\|\s+\d{2} \w+ \d{2} \d{2}:\d{2}\s+\(listing time\)\s+\|/,
            ""
          )
          .trim();
        const isAssistantMessage =
          messageElement.innerText.includes("main account");
        let lines = cleanedText?.split("\n");
        let messages = lines?.splice(0, 1)[0];
        if (lines.length == 0) {
          messages = "";
        }

        if (isAssistantMessage) {
          if (
            messageArray?.length > 0 &&
            messageArray[messageArray?.length - 1].user &&
            !messageArray[messageArray?.length - 1]?.assistant
          ) {
            messageArray[messageArray?.length - 1].assistant = messages;
          } else {
            messageArray.push({ assistant: messages });
          }
        } else {
          messageArray.push({ user: messages });
        }
      }
      // setMessages(messageArray);
      return messageArray;
    }
  } catch (error) {
    console.log("Error at get all message: ", error);
  }
  return messageArray;
};

export { getPrompt, getListDetails, getAllMessages };
