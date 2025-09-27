import { useState, useEffect, useCallback } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Header from "./Header";
import api from "@/api/api";
import Shimmer from "../../common/shimmer/userShimmer";
import Pagination from "@/components/ui/pagination";
import { toast } from "sonner";

export default function Users({ setOpenModal }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [editedUser, setEditedUser] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pageSize = 10;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `/user/all-users?page=${currentPage}&page_size=${pageSize}`
      );
      setUserData(response.data.detail);
      setError(null);
    } catch (err) {
      setError("Failed to fetch users");
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openModal = (user) => {
    setCurrentUser(user);
    setEditedUser({
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      password: "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentUser(null);
    setEditedUser({ firstname: "", lastname: "", email: "", password: "" });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateUser = async () => {
    if (currentUser) {
      try {
        await api.put("/admin/update-user", {
          id: currentUser.id,
          ...editedUser,
        });
        toast.success("User updated successfully");
        await fetchUsers();
        closeModal();
      } catch (err) {
        toast.error("Failed to update user");
        console.error("Error updating user:", err);
      }
    }
  };

  const handleDeleteUser = async () => {
    if (currentUser) {
      try {
        await api.delete("/admin/delete-user",{ data:{ id: currentUser.id }});
        toast.success("User deleted successfully");
        await fetchUsers();
        closeModal();
      } catch (err) {
        toast.error("Failed to delete user");
        console.error("Error deleting user:", err);
      }
    }
  };

  return (
    <div className="p-8 overflow-auto">
      <div>
        <Header title="Users" setOpenModal={setOpenModal} />
        {loading && <Shimmer />}
        {error && <div>Error: {error}</div>}
        {!loading && !error && userData && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>User List</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userData.data.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.firstname}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openModal(user)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Pagination
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              totalItems={userData.data.total_count || 0}
            />
          </>
        )}
      </div>

      {/* Edit User Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px] max-w-[95vw] w-full">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit User</DialogTitle>
            <DialogDescription className="text-sm">
              Make changes to the user&apos;s information here. Click save when
              you&apos;re done.
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
              className="bg-green-800 text-white w-full sm:w-auto mb-2 sm:mb-0"
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
              <Button
                variant="destructive"
                onClick={handleDeleteUser}
                className="w-full sm:w-auto"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete User
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
