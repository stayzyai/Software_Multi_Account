import { VARIABLES } from "./UpsellConstant";
import { PlusIcon } from "lucide-react";

const UpsellMessages = ({
  setVariablesDropdownOpen,
  variablesDropdownOpen,
  variablesDropdownRef,
  textareaRef,
  message,
  setMessage,
}) => {
  const insertVariable = (variable) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const newMessage =
        message.substring(0, start) +
        `{${variable.value}}` +
        message.substring(end);
      setMessage(newMessage);
      setVariablesDropdownOpen(false);
      setTimeout(() => {
        if (textareaRef.current) {
          const newPosition = start + variable.value.length + 2;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newPosition, newPosition);
        }
      }, 0);
    }
  };

  return (
    <div className="space-y-2">
      <div
        ref={variablesDropdownRef}
        className="flex items-center justify-between"
      >
        <label htmlFor="upsell-message" className="text-sm font-semibold">
          Upsell Message
        </label>
        <button
          onClick={() => setVariablesDropdownOpen(!variablesDropdownOpen)}
          className="flex items-center text-xs border rounded-md px-2 py-1 hover:bg-gray-50"
        >
          <PlusIcon className="h-3 w-3 mr-1" />
          Variables
        </button>
        {variablesDropdownOpen && (
          <div className="absolute md:left-1/3 left-24 top-[43%] z-20 min-w-72 h-80 overflow-y-scroll scrollbar-hide bg-white border rounded-md shadow-lg">
            <ul className="py-1">
              {VARIABLES?.map((variable) => (
                <li
                  key={variable.value}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex gap-2 text-nowrap items-center"
                  onClick={() => insertVariable(variable)}
                >
                  <span className="font-normal text-black text-sm border px-[5px] rounded-md border-black">
                    {variable.label}
                  </span>
                  <span className="text-gray-500 md:text-sm text-xs">
                    {variable.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <textarea
        ref={textareaRef}
        id="upsell-message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full border rounded-md p-3 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-green-200 resize-none scrollbar-hide"
      />
    </div>
  );
};

export default UpsellMessages;
