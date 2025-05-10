import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import EditUserDetails from "./EditUserdetails";
import { useEffect } from "react";
import PaymentData from "./PaymentDetails";
import axios from "axios";
import { toast } from "sonner";
import { setUser } from "../../../../store/userSlice";

const UserProfile = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [editedUser, setEditedUser] = useState({
    id: "",
    firstname: "",
    lastname: "",
    email: "",
    password: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [image, setImage] = useState(null);
  const [upload, setUpload] = useState(null);
  const [newImage, setNewImage] = useState(false);
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch()

  const userProfile = useSelector((state) => state.user);

  useEffect(() => {
    setCurrentUser({
      id: userProfile.id,
      firstname: userProfile.firstname,
      lastname: userProfile.lastname,
      email: userProfile.email,
      role: userProfile.role,
    });
    setImage(userProfile?.image_url);
  }, [isModalOpen]);

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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUpload(file);
      setNewImage(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleRemoveImage = () => {
    setImage(userProfile?.image_url);
    setUpload(userProfile?.image_url);
    setNewImage(false);
  };

  const handleSave = async () => {
    setLoading(true)
    try {
      if (!upload) {
        setLoading(false)
        return;
      }
      const formData = new FormData();
      formData.append("file", upload);
      const token = localStorage.getItem("token");
      const BASE_URL = import.meta.env.VITE_API_HOST;
      const response = await axios.post(
        `${BASE_URL}/user/upload-image`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if(response?.status == 200){
        setUpload(null);
        setNewImage(false);
        dispatch(setUser({...currentUser,
        image_url: response.data.url,
      }));

      }
      setUpload(response?.data?.url);
      setNewImage(false);
      toast.success("Upload image sucessfully..");
      setLoading(false)

    } catch (error) {
      toast.error("Some error occured. Please try again");
      setLoading(false)
      console.error("Upload error:", error.response?.data || error.message);
    }
  };

  return (
    <div className="px-7 pb-10">
      <div className="mx-auto md:px-8 px-2 py-4 shadow-xl bg-white rounded-xl border border-gray-300">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 font-inter">
          Profile
        </h1>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex items-center">
            <h2 className="text-xl text-nowrap font-semibold text-gray-800 dark:text-white mb-4">
              Account Details
            </h2>
            <Button
              className="flex justify-end w-full"
              variant="ghost"
              size="icon"
              onClick={() => openModal(currentUser)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 dark:text-gray-200">
            <div>
              <p className="text-sm font-medium">First Name</p>
              <p className="text-lg">{currentUser?.firstname}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Last Name</p>
              <p className="text-lg">{currentUser?.lastname}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-lg">{currentUser?.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Role</p>
              <span className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 px-2 py-1 rounded-full text-xs font-semibold">
                {currentUser?.role}
              </span>
            </div>
          </div>
          {/* Profile Image Section */}
          <p className="font-medium pt-4 text-md">Profile Picture</p>
          <div className="flex items-center py-2">
            <div className="relative">
              {image ? (
                <img
                  src={image}
                  alt="Profile"
                  className="w-24 h-24 ml-2 rounded-full object-cover mb-2"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-200 rounded-full mb-3"></div>
              )}
              {newImage ? (
                <>
                  <button
                    onClick={handleRemoveImage}
                    className=" bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-sm text-xs mr-2"
                  >
                    Clear
                  </button>
                  <button disabled={loading}
                    onClick={handleSave}
                    className="bg-green-800 hover:bg-green-700 text-white px-2 py-1 text-xs rounded-sm font-semibold"
                  >
                    {loading ? "Uploading...": "Upload"}
                  </button>
                </>
              ) : (
                <div>
                  {/* File Input */}
                  <input
                    type="file"
                    id="profile-image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="profile-image"
                    className="cursor-pointer text-blue-600 hover:text-blue-800 mb-2"
                  >
                    Choose File
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
        <PaymentData />

      </div>
      <EditUserDetails
        closeModal={closeModal}
        openModal={openModal}
        currentUser={currentUser}
        setEditedUser={setEditedUser}
        editedUser={editedUser}
        setIsModalOpen={setIsModalOpen}
        isModalOpen={isModalOpen}
        setCurrentUser={setCurrentUser}
      />
    </div>
  );
};

export default UserProfile;
