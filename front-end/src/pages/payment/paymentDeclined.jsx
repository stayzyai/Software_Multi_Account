import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function PaymentDeclined() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="text-center">
        <div className="flex items-center justify-center mb-8">
          <img src="/Logo_Black.png" width={180} />
        </div>
        <h1 className="text-6xl font-bold text-red-800 mb-4">
          Payment Declined
        </h1>
        <p className="text-gray-500 mb-8">
          Your payment has been declined. Please try again.
        </p>
        <Button
          className="bg-red-800 hover:bg-red-700 text-white"
          onClick={() => navigate("/admin/dashboard")}
        >
          Go to Home
        </Button>
      </div>
    </div>
  );
}
