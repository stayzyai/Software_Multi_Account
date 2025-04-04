import { useState } from "react";
import { Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { validateEmail } from "@/lib/utils";
import api from "@/api/api";
import { setItem } from "@/helpers/localstorage";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

export function LoginComponent({ role = "user", redirectPath = "/dashboard" }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateEmail(email)) {
      toast.error("Invalid email format", {
        className: "error-toast",
        duration: 5000,
      });
      return;
    }
    setLoading(true);
    try {
      const response = await api.post("/user/login", {
        email,
        password,
        role,
      });
      const { access_token, refresh_token } = response.data.detail;
      setItem("token", access_token);
      setItem("refreshToken", refresh_token);
      setItem("userRole", role);
      login(access_token, refresh_token, role);
      navigate(redirectPath);
      toast.success("Login successful", {
        className: "success-toast",
        duration: 5000,
      });
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail?.message || "Login failed", {
        className: "error-toast",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <img src="/Logo_Black.png" width={100} />
          </div>
          <CardTitle className="text-2xl font-bold">
            Login to your account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="text"
                placeholder="Enter your email"
                value={email}
                onChange={handleInputChange(setEmail)}
              />
            </div>
            <div className="mb-6">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={handleInputChange(setPassword)}
              />
              <div className="mt-2 text-right">
                <Link to="/user/forgot-password" className="text-blue-500 hover:underline text-sm">
                  Forgot Password?
                </Link>
              </div>
            </div>
            <Button className="w-full bg-green-800 hover:bg-green-700">
              {loading ? "Logging in..." : "Log in"}
            </Button>
            {role === "user" && (
              <div>
                <div className="flex items-center justify-center">
                  <div className="flex-grow border-t-[1px] border-black"></div>
                  <span className="px-4 text-black my-2 text-lg">Or</span>
                  <div className="flex-grow border-t-[1px] border-black"></div>
                </div>
                <Link to="/user/signup">
                  <div className="w-full bg-green-800 hover:bg-green-700 cursor-pointer rounded-sm py-1 text-center text-white">
                    Create an accout
                  </div>
                </Link>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
