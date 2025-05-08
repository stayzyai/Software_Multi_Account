import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "./Header";
import { SettingSkeleton } from "../../common/shimmer/setting";
import { toast } from "sonner";
import api from "@/api/api";

export default function Settings({ setOpenModal }) {
  const [profile, setProfile] = useState(null);
  const [initialProfile, setInitialProfile] = useState(null);
  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await api.get("/user/profile");
      setProfile(data.data);
      setInitialProfile(data.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile data");
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async () => {
    if (!profile || !initialProfile) return;

    const updatedFields = {
      id: profile.id,
      firstname: profile.firstname,
      lastname: profile.lastname,
      email: profile.email,
    };

    const hasChanges = Object.keys(updatedFields).some(
      (key) => updatedFields[key] !== initialProfile[key]
    );

    if (hasChanges) {
      try {
        const response = await api.post("/user/update", updatedFields);
        if (response.status === 200) {
          toast.success("Profile updated successfully");
          fetchProfile();
        } else {
          toast.error("Failed to update profile");
        }
      } catch (error) {
        console.error("Error updating profile:", error);
        toast.error("Failed to update profile");
      }
    } else {
      toast.info("No changes detected in the profile");
    }
  };

  const handleChangePassword = async () => {
    try {
      const passwordUpdateData = {
        current_password: passwords.current_password,
        new_password: passwords.new_password,
        email: profile.email,
      };

      const response = await api.put(
        "/user/change-password",
        passwordUpdateData
      );
      if (response.status === 200) {
        setPasswords({ current_password: "", new_password: "" });
        toast.success("Password changed successfully");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Failed to change password");
    }
  };

  if (loading) {
    return <SettingSkeleton />;
  }

  if (!profile) {
    return <div>No profile data available.</div>;
  }

  return (
    <div className="p-8 overflow-auto">
      <div>
        <Header title="Settings" setOpenModal={setOpenModal} />

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Manage your account details and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firstname">First Name</Label>
                <Input
                  id="firstname"
                  name="firstname"
                  value={profile.firstname}
                  onChange={handleProfileChange}
                  placeholder="Your First Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastname">Last Name</Label>
                <Input
                  id="lastname"
                  name="lastname"
                  value={profile.lastname}
                  onChange={handleProfileChange}
                  placeholder="Your Last Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={profile.email}
                  onChange={handleProfileChange}
                  placeholder="your.email@example.com"
                />
              </div>
              <Button
                className="bg-green-800 text-white"
                onClick={handleUpdateProfile}
              >
                Update Profile
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your account security preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password">Current Password</Label>
                <Input
                  id="current_password"
                  name="current_password"
                  type="password"
                  value={passwords.current_password}
                  onChange={handlePasswordChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_password">New Password</Label>
                <Input
                  id="new_password"
                  name="new_password"
                  type="password"
                  value={passwords.new_password}
                  onChange={handlePasswordChange}
                />
              </div>
              <Button
                className="bg-green-800 text-white"
                onClick={handleChangePassword}
              >
                Change Password
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
