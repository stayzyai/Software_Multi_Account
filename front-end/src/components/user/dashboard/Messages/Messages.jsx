const Messages = ({ setOpenMessage, setChatInfo }) => {
  const messages = [
    {
      id: 1,
      name: "Guy Hawkins",
      message:
        "I neglected to mention that I definitely won't be coming to the party on Saturday",
      image: "/icons/Avatar.svg",
    },
    {
      id: 2,
      name: "Devon Lane",
      message: "Please remember to bring the documents to the meeting.",
      image: "/icons/Avatar.png",
    },
    {
      id: 3,
      name: "Darlene Robertson",
      message: "I'll need a few more days to complete the report.",
      image: "/icons/Avatar_1.png",
    },
    {
      id: 4,
      name: "Eleanor Pena",
      message: "Don't forget to review the presentation slides.",
      image: "/icons/Avatar_2.png",
    },
  ];

  const handleClick = (id) => {
    setOpenMessage(true);
    const user = messages.filter((item) => (item.id === id));
    setChatInfo(user);
  };

  return (
    <div className="flex flex-col space-y-6 py-4">
      <div className="overflow-hidden bg-white rounded-[14px] shadow-md mx-1 border-[0.2px] border-gray-400">
        <div className="flex justify-between p-5">
          <h2 className="text-lg font-semibold">Latest Messages</h2>
          <div className="flex gap-6 mr-4">
            <div className="flex gap-2 text-[14px] cursor-pointer">
              <button>Date</button>
              <img src="/icons/down.svg" alt="down" width={14} height={14} />
            </div>
            <div className="flex gap-2 text-[14px] cursor-pointer">
              <button>Listing</button>
              <img src="/icons/down.svg" alt="down" width={14} height={14} />
            </div>
            <div className="flex gap-2 text-[14px] cursor-pointer">
              <button>Task</button>
              <img src="/icons/down.svg" alt="down" width={14} height={14} />
            </div>
          </div>
        </div>
        <div className="divide-y mb-6 border-y border-gray-200 mx-4">
          {messages?.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-[auto_1fr_auto_auto] items-center px-6 py-3 gap-4"
            >
              <input
                type="checkbox"
                className="w-6 h-6 bg-white rounded-md border-2 border-gray-300 cursor-pointer appearance-none checked:bg-blue-500 checked:border-transparent checked:relative checked:before:content-['✔'] checked:before:absolute checked:before:text-white checked:before:left-1/2 checked:before:top-1/2 checked:before:transform checked:before:-translate-x-1/2 checked:before:-translate-y-1/2 focus:outline-none"
              />
              <div className="flex items-center space-x-4">
                <img
                  className="w-10 h-10 rounded-full"
                  src={item.image}
                  alt="Avatar"
                />
                <div
                  onClick={() => handleClick(item.id)}
                  className="cursor-pointer w-full"
                >
                  <p className="font-medium text-gray-800">{item.name}</p>
                  <p className="text-sm text-[#7F7F7F] hidden md:block">{item.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Messages;
