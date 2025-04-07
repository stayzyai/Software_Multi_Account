import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import api from "@/api/api";
import { toast } from "sonner";

export function ResetPasswordComponent() {
    const { token } = useParams();
    console.log("token", token)
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (!token) {
            toast.error("Invalid or missing reset token.");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match!");
            return;
        }

        setLoading(true)

        try {
            const response = await api.post("/user/reset-password", {
                token, 
                new_password: newPassword
            });

            toast.success(response.data.message);
            navigate("/user/login");
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex items-center justify-center mb-4">
                        <img src="/Logo_Black.png" width={100} alt="Logo" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Reset Your Password</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleResetPassword}>
                        <div className="mb-4">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                                id="new-password"
                                type="password"
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button className="w-full bg-green-800 hover:bg-green-700" type="submit">
                            {loading ? "Resetting..." : "Reset Password"}
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
};