import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="text-center">
        <div className="flex items-center justify-center mb-8">
          <img src="/Logo_Black.png" width={180} />
        </div>
        <h1 className="text-6xl font-bold text-green-800 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-600 mb-6">
          Page Not Found
        </h2>
        <p className="text-gray-500 mb-8">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
        <Button
          className="bg-green-800 hover:bg-green-700 text-white"
          onClick={() => navigate("/admin/dashboard")}
        >
          Go to Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
