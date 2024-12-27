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

export const SignupComponent = ({ role, redirectPath }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateEmail(formData.email)) {
      toast.error("Invalid email format", {
        className: "error-toast",
        duration: 5000,
      });
      return;
    }
    setLoading(true);
    try {
      const response = await api.post("/user/signup", {
        ...formData,
        role,
      });
      const { access_token, refresh_token } = response.data.detail;
      setItem("token", access_token);
      setItem("refreshToken", refresh_token);
      login(access_token, refresh_token, role);
      setItem("userRole", role);
      navigate(redirectPath);
      toast.success("Registration successful", {
        className: "success-toast",
        duration: 5000,
      });
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.detail?.message || "Registration failed",
        {
          className: "error-toast",
          duration: 5000,
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field) => (e) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <img src="/Logo_Black.png" width={100} />
          </div>
          <CardTitle className="text-2xl font-bold">
            Create an account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <Label htmlFor="firstname">First Name</Label>
              <Input
                id="firstname"
                type="text"
                placeholder="Enter your first name"
                value={formData.firstname}
                onChange={handleInputChange("firstname")}
              />
            </div>
            <div className="mb-4">
              <Label htmlFor="lastname">Last Name</Label>
              <Input
                id="lastname"
                type="text"
                placeholder="Enter your last name"
                value={formData.lastname}
                onChange={handleInputChange("lastname")}
              />
            </div>
            <div className="mb-4">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="text"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange("email")}
              />
            </div>
            <div className="mb-6">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange("password")}
              />
            </div>
            <Button className="w-full bg-green-800 hover:bg-green-700">
              {loading ? "Signing up..." : "Sign up"}
            </Button>
            <div className="flex items-center justify-center">
              <div className="flex-grow border-t-[1px] border-black"></div>
              <span className="px-4 text-black my-2 text-lg">Or</span>
              <div className="flex-grow border-t-[1px] border-black"></div>
            </div>
            <Link to={role === "user" ? "/user/login" : "/"}>
              <div className="w-full bg-green-800 hover:bg-green-700 cursor-pointer rounded-sm py-1 text-center text-white">
                Login
              </div>
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
