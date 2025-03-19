const RenderPreview = ({ message }) => {
  const parts = message.split(/(\{[^}]+\})/g);

  return parts.map((part, index) => {
    if (part.startsWith("{") && part.endsWith("}")) {
      const variableName = part.slice(1, -1);

      let displayName = variableName;

      if (variableName === "discount") {
        displayName = "Discount";
      } else if (variableName === "guest_name") {
        displayName = "Guest name";
      }

      return (
        <span
          key={index}
          className="px-[3px] py-[1px] rounded text-blue-600 text-sm border border-black p-1"
        >
          {displayName}
        </span>
      );
    }

    return <span className="text-sm text-wrap font-semibold" key={index}>{part}</span>;
  });
};

export default RenderPreview;
