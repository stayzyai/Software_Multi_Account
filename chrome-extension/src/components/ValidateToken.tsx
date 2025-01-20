import { useState, useEffect } from "react";
import SuccessPage from "./Success";
import LogoutPage from "./Logout";
import { getApi } from "@/API/api";

const ValidateToken = () => {
  const [token, setToken] = useState("");
  const [valid, setValid] = useState(false);
  const [status, setStatus] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    chrome.storage.local.get("hostawaytokenValidated", (result) => {
      if (result.hostawaytokenValidated) {
        setVerified(true);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let response;
    try {
      response = await getApi("/user/validate-extension-token", token);
    } catch (e) {
      console.log("Error at validate token: ", e);
    }
    if (response?.detail?.status) {
      setValid(true);
      chrome.storage.local.set({ hostawaytokenValidated: token }, () => {
        console.log("Token validation status saved");
        chrome.tabs.query(
          { url: `${import.meta.env.VITE_API_HOSTWAY_URL}` },
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
    }
    setStatus(true);
  };

  if (verified) {
    return <LogoutPage />;
  }

  const handleKeyDown = (e: any) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit;
    }
  };

  return (
    <div className="w-full flex justify-center items-center font-sans">
      {status ? (
        <SuccessPage valid={valid} />
      ) : (
        <div className="w-96 max-w-full bg-white">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="w-full rounded-xl">
              <div className="flex justify-center m-2">
                <img src="/logo.png" width={80} height={80} />
              </div>
              <textarea
                style={{ borderRadius: "5px" }}
                onChange={(e) => setToken(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e)}
                id="token"
                className="w-full h-14 border border-gray-300 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#2D8062]"
                placeholder="Enter your extension key"
                required
              />
            </div>
            <button
              style={{ borderRadius: "5px" }}
              type="submit"
              className={`w-full bg-[#2D8062] text-white rounded-md py-2 text-sm font-semibold flex justify-center items-center border-2 border-green-600 active:bg-green-800 hover:bg-[#2D8050]`}
            >
              Set Extension Key
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ValidateToken;
