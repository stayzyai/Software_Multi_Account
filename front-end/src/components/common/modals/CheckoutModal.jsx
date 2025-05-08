import { useEffect } from "react";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const CheckoutModal = ({ isOpen, setIsOpen, isConfirm,setIsConfirm, checkoutUrl }) => {
  useEffect(() => {
    if (isConfirm && checkoutUrl) {
      const redirectTimer = setTimeout(() => {
        window.location.href = checkoutUrl;
      }, 500);

      return () => {
        clearTimeout(redirectTimer);
      };
    }
  }, [isConfirm, checkoutUrl]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 font-inter">
        <div className="bg-[#FCFDFC] rounded-lg shadow-lg w-full max-w-[500px] h-[300px] mx-4 border border-gray-400 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-md font-semibold">Complete Your Payment</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 rounded-full p-1"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
          {!isConfirm ? (<div className="flex-1 flex flex-col items-center p-6 text-center">
            <h3 className="text-lg font-semibold">
              This feature is part of our paid plan at just $50/month.
            </h3>
            <p className="text-sm text-gray-600 mt-10">
              Upgrade now to unlock full access and streamline your workflow.
              Would you like to continue to payment?
            </p>
            <div className="w-full flex justify-between mt-4 px-10">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Not Now
              </Button>
              <Button className="bg-green-800 hover:bg-green-700" onClick={() => setIsConfirm(true)}>
                Upgrade & Continue
              </Button>
            </div>
          </div>)
            :
            (<div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#34C759] mb-4"></div>
              <p className="text-lg mb-2">Redirecting to Stripe Checkout...</p>
              <p className="text-sm text-gray-500">
                You will be redirected to complete your payment securely on
                Stripe&apos;s platform.
              </p>
            </div>)}
        </div>
      </div>
    </>
  );
};

export default CheckoutModal;
