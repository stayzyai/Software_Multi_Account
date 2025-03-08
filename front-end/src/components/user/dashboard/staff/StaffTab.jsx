import { useEffect, useState } from "react";
import Header from "../Header";
import { useSelector, useDispatch } from "react-redux";
import Staff from "./Staff";
import TaskTableShimmer from "../../../common/shimmer/TaskTableShimmer";
import { getHostawayUser } from "../../../../helpers/TaskHelper";
import { setHostawayUsers } from "../../../../store/hostawayUserSlice";

const StaffTab = () => {
  const users = useSelector((state) => state.hostawayUser.users);
  const [staffs, setStaff] = useState([]);
  const [loder, setLoader] = useState(true);
  const columns = ["", "Name", "Email", "Phone"];

  const getRandomColor = () => {
    const colors = ["#FF5733", "#33FF57", "#3357FF", "#F3FF33", "#FF33A8"];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  const dispatch = useDispatch()

  const fetchUsers = async () => {
    try {
      const userData = users?.length === 0 ? await getHostawayUser() : users;
      if (users?.length === 0) dispatch(setHostawayUsers(userData));

      const userInfo = userData?.map((user) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName || "",
        email: user.email,
        phone: user.phone || "N/A",
        profile: user.profilePictureUrl || "",
        bgColor: getRandomColor(),
      }));
      setStaff(userInfo);
      setLoader(false);
    } catch (error) {
      console.error("Error fetching users: ", error);
      setLoader(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div>
      <Header title={"Staff"} />
      {!loder ? (
        <Staff columns={columns} staffs={staffs} />
      ) : (
        <div className="mt-28 px-10">
          <TaskTableShimmer />
        </div>
      )}
    </div>
  );
};

export default StaffTab;
