import '../style/style.css';

interface AIContentProps {
  text: string;
  setSuggestions: React.Dispatch<React.SetStateAction<boolean | null>>;
}

const AIContent: React.FC<AIContentProps> = ({ text, setSuggestions }) => {

  const handleCopyClicked = ()=>{
    setSuggestions(false)
    navigator.clipboard.writeText(text).then(() => {
      alert("Text copied to clipboard!");
    })
    .catch((err) => {
      console.error("Error copying text: ", err);
    });
  }

  const handleSend = () => {
    setSuggestions(false)
    const textarea = document.querySelector(".UiTextArea.MessagesInboxForm-textField") as HTMLTextAreaElement;
    const button = document.querySelector(".Button.Button--primary.MessagesInboxForm-submitButton") as HTMLButtonElement;
    button.disabled = false;

    if (textarea) {
      textarea.value = text;
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      if (button) {
        button.click();
        console.log("Button clicked !");
      }
    }
  };

  const handleDismissed = ()=>{
    setSuggestions(false)
  }

  return (
    <div className={`z-[10000] flex justify-center fixed bottom-48 bg-[#2D8062] font-sans custom-container`} style={{ borderRadius: "5px" }}>
      <div className="p-3" style={{ borderRadius: "5px" }}>
        <div className="flex justify-center">
          <p
            className="px-2 py-3 mb-6 text-white text-lg font-normal text-wrap"
            style={{ borderRadius: "10px"}}
          >
            {text}
          </p>
        </div>
        <div className="font-semibold text-md text-white flex gap-6 justify-center">
          <button className="px-4 py-2.5 bg-green-800 border border-green-600" style={{ borderRadius: "5px" }} onClick={handleSend}>Send</button>
          <button className="px-3 py-2.5 bg-red-500 border border-red-300" style={{ borderRadius: "5px" }} onClick={handleDismissed}>Dismissed</button>
          <button
            className="px-3 py-2.5 bg-white border-white text-black"
            style={{ borderRadius: "5px" }}
            onClick={handleCopyClicked}
          >
            Copy to clipboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIContent;
