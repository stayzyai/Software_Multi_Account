
const LogoutPage: React.FC = () => {

  const handleLogout = () => {
    chrome.storage.local.remove("hostawaytokenValidated", () => {
      chrome.tabs.query(
        { url: `${import.meta.env.VITE_API_HOSTWAY_URL}`},
        (tabs) => {
          if (tabs.length > 0) {
            tabs.forEach((tab) => {
              if (tab.id) {
                chrome.tabs.reload(tab.id);
              }
            });
          } else {
            console.log("No matching tab found.");
          }
        }
      );
      
    });
  };

  return (
    <div className="flex justify-center w-96 bg-white mt-1 font-sans">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <img src="/Logo.png" width={80} height={80} />
        </div>
        <h2 className="text-lg font-semibold">
          You are now logged into Stayzy AI!
        </h2>
        <button style={{borderRadius:"5px"}}
          onClick={handleLogout}
          className="bg-[#2D8062] text-white py-2 px-4 font-semibold mt-4 border-2 border-green-600 active:bg-green-800 hover:bg-[#2D8050]"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default LogoutPage;
