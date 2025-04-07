import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from "@/api/api";
import { Link } from "react-router-dom";

export function ForgotPasswordComponent() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    if(!validateEmail(email)){
        toast.error("Please enter a valid email address");
        return;
    }
    setLoading(true);
    try {
      await api.post("/user/forgot-password", { email });
      toast.success("Password reset link sent to your email");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.response?.data?.detail || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <img src="/Logo_Black.png" width={100} />
          </div>
          <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button className="w-full bg-green-800 hover:bg-green-700">
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Link to="/user/login" className="text-blue-500 hover:underline text-sm">
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}