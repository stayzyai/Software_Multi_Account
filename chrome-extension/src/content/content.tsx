import React, { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";
import { postApi, } from "@/API/api";
import { getPrompt, getListDetails, getAllMessages } from "@/helpers/promptHelper";
import AIContent from "@/components/AIContent";

type Message = { user: string; assistant: string };

const ContentPage: React.FC = () => {
  const [isValid, setIsValid] = useState(false);
  const [isFormAvailable, setIsFormAvailable] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState<string>("");
  const [buttonText, setButtonText] = useState("Stayzy AI");
  const [suggestions, setSuggestions] = useState<boolean | null>(false);
  const [apiKey, setApiKey] = useState<string>("");
  const [listId, setListId] = useState("")

  const messagesRef = useRef(messages);
  const propertyDetailRef = useRef("")

  const fetchListingDetails = async(listId: string, apiKey: string) =>{
    propertyDetailRef.current =  await getListDetails(listId, apiKey)
  }
  useEffect(() => {
    chrome.storage.local.get("hostawaytokenValidated", (result) => {
      if (result.hostawaytokenValidated) {
        setApiKey(result.hostawaytokenValidated)
        setIsValid(true);
      }
    });
    // Mutation observer for form availability
    const observer = new MutationObserver(() => {
      const link = document.querySelector('.UiFieldWrapper-body a');
      const href = link ? link.getAttribute('href') : '';
      if(href){
        const Id = href.replace('/listing/edit/', '');
        setListId(Id)
      }
    const formElement = document.querySelector(".MessagesInboxForm");
    setIsFormAvailable(!!formElement);
    const mess = document.querySelectorAll(".MessagesInboxChatItem-body")
    if (mess.length > 0 ) {
      const messageArray = getAllMessages(mess)
    setMessages(messageArray);
    }else{
      setMessages([])
    }
  });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (isFormAvailable && isValid) {
      const existingContainer = document.querySelector("#ai-suggestion-container");
      if (!existingContainer) {
        const targetElement = document.querySelector(".MessagesInboxForm-container_center_controls");
        if (targetElement) {
          const container = document.createElement("div");
          container.id = "ai-suggestion-container";
          targetElement.appendChild(container);
          // Render the DynamicContent component into the container
          ReactDOM.render(<DynamicContent buttonText={buttonText} handleClicked={handleClicked} />, container);
        }
      } else {
        // If container exists, update the rendered content
        ReactDOM.render(<DynamicContent buttonText={buttonText} handleClicked={handleClicked} />, existingContainer);
      }
    }
  }, [isFormAvailable, isValid, buttonText, suggestions]);

    useEffect(() => {
      messagesRef.current = messages;
    }, [messages]);

    useEffect(()=>{
          if(listId !== ""){
        fetchListingDetails(listId, apiKey)
      }
    }, [listId])

  const handleClicked = async () => {
    if (buttonText === "Stayzy AI") {
      setButtonText("Generating...");
      const {prompt, latestMessages} = await getPrompt(messagesRef.current, propertyDetailRef.current)
      const messages = Object.values(latestMessages)[0]
      
      // Get username from the conversation if available
      const recipientNameElement = document.querySelector(".MessagesInboxConversation-title");
      const username = recipientNameElement ? recipientNameElement.textContent?.trim() : null;
      
      const data = { 
        prompt: prompt, 
        messsages: messages,
        username: username
      };
      
      try {
        const response = await postApi("/user/ai-suggestion", data, apiKey);
        setText(response.answer);
        setButtonText("Copy to Clipboard");
        setButtonText("Stayzy AI");
        setSuggestions(true)
      }
      catch(error){
        console.log("Error at I suggestion: ", error)
        setButtonText("Stayzy AI");
        setText("Please try again..!")
      }
    } else if (buttonText === "Copy to Clipboard") {
      navigator.clipboard.writeText(text).then(() => {
          alert("Text copied to clipboard!");
        })
        .catch((err) => {
          console.error("Error copying text: ", err);
        });
      setButtonText("Stayzy AI");
    }
  };
  const DynamicContent: React.FC<{ buttonText: string; handleClicked: () => void }> = ({
    buttonText, handleClicked}) => {
    return (
      <div className="text-white font-semibold md:text-md text-sm text-nowrap font-sans">
        <button style={{ borderRadius: "5px" }} onClick={handleClicked}
          className="px-3 py-2 xl:py-1.5 bg-[#2D8062] border">
          {buttonText}
        </button>
        {suggestions && <AIContent text={text} setSuggestions = {setSuggestions}/>}
      </div>
    );
  }
  // Since content is dynamically appended, return null from the main component
  return null;
};
export default ContentPage;
