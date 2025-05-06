import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from "@/api/api";
import { setUser } from "../../../../store/userSlice";
import { useDispatch, useSelector } from "react-redux";

const EditUserDetails = ({
  closeModal,
  editedUser,
  setEditedUser,
  isModalOpen,
  setIsModalOpen,
  currentUser,
  setCurrentUser,
}) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateUser = async () => {
    if (currentUser) {
      try {
        const response = await api.post("/user/update", {
          id: currentUser.id,
          ...editedUser,
        });
        if (response?.status == 200) {
          const data = response?.data?.detail?.data;
          const { ...updatedInfo } = data;
          dispatch(
            setUser({
              ...updatedInfo,
              chat_list: user.chat_list,
              role: user.role,
              ai_enable: user.ai_enable,
            })
          );
          setCurrentUser({ ...updatedInfo, role: "user" });
          toast.success("User updated successfully");
          closeModal();
        }
      } catch (err) {
        const msg = `: ${err?.response?.data?.detail}`;
        toast.error(`Failed to update ${msg}`);
        console.error("Error updating user:", err);
        closeModal();
      }
    }
  };

  return (
    <div>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px] max-w-[95vw] w-full">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit User</DialogTitle>
            <DialogDescription className="text-sm">
              Update your profile information below and click Save when you're
              finished
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="firstname" className="text-sm font-medium">
                Name
              </Label>
              <Input
                id="firstname"
                name="firstname"
                value={editedUser.firstname}
                onChange={handleInputChange}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastname" className="text-sm font-medium">
                Last Name
              </Label>
              <Input
                id="lastname"
                name="lastname"
                value={editedUser.lastname}
                onChange={handleInputChange}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={editedUser.email}
                onChange={handleInputChange}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                New Password (leave blank to keep current)
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={editedUser.password}
                onChange={handleInputChange}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:space-x-2">
            <Button
              onClick={handleUpdateUser}
              className="bg-green-800 text-white w-full sm:w-auto mb-2 sm:mb-0 hover:bg-green-700"
            >
              Save Changes
            </Button>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={closeModal}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      ;
    </div>
  );
};

export default EditUserDetails;
