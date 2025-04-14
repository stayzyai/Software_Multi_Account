import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Users, Ticket } from "lucide-react";
import Header from "./Header";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import StatCard from "../../common/statcard/StatCard";
import Pagination from "../../ui/pagination";
import Shimmer from "../../common/shimmer/userShimmer";
import { fetchMessageStats } from "../../../helpers/statHelper";
import {
  getUserData,
  getTicketStat,
  getUserStat,
} from "../../../helpers/adminStat";

const Home = ({ setOpenModal }) => {
  const [userData, setUserData] = useState(null);
  const [userError, setUserError] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [ticketStatsData, setTicketStatsData] = useState(null);
  const [automatedMessages, setAutomatedMessage] = useState(null);
  const [userStat, setUserStat] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const fetchUserData = useCallback(async () => {
    setUserLoading(true);
    const response = await getUserData(currentPage, pageSize);
    if (response.status == 200) {
      setUserData(response.data);
      setUserLoading(false);
      return;
    }
    setUserError(error.message);
  }, [currentPage, pageSize]);

  const fetchStatsData = async () => {
    setStatsLoading(true);
    const response = await getTicketStat();
    if (response.status == 200) {
      setTicketStatsData(response?.data.task_status);
    }
    const messageResponse = await fetchMessageStats();
    setAutomatedMessage(messageResponse);
    setStatsLoading(false);
    const userResponse = await getUserStat();
      setUserStat(userResponse);
  };

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    fetchStatsData();
  }, []);

  const isLoading = userLoading || statsLoading;

  return (
    <div className="p-8 overflow-auto">
      <div className="mx-auto">
        <Header title={"Dashboard"} setOpenModal={setOpenModal} />
        {isLoading ? (
          <Shimmer />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {statsLoading ? (
                <div>Loading statistics...</div>
              ) : ticketStatsData ? (
                <>
                  <StatCard
                    title="Total Automated Messages"
                    icon={
                      <BarChart className="h-4 w-4 text-muted-foreground" />
                    }
                    stats={{
                      current_count: automatedMessages?.total_messages,
                      is_increase: automatedMessages?.is_increase,
                      percentage_change: automatedMessages?.percentage_change,
                    }}
                  />
                  <StatCard
                    title="Total Users"
                    icon={<Users className="h-4 w-4 text-muted-foreground" />}
                    stats={{current_count : userStat?.current_count, is_increase: userStat?.is_increase, percentage_change: userStat?.percentage_change }}
                  />
                  <StatCard
                    title="Total Tickets Generated"
                    icon={<Ticket className="h-4 w-4 text-muted-foreground" />}
                    stats={{
                      current_count: ticketStatsData?.total_tasks,
                      is_increase: ticketStatsData?.is_increase,
                      percentage_change: ticketStatsData?.percentage_change,
                    }}
                  />
                </>
              ) : (
                <div>Error or no data available</div>
              )}
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Recent Users</CardTitle>
              </CardHeader>
              <CardContent>
                {userError && <div>Error: {userError}</div>}
                {!userLoading && !userError && userData && (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Join Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userData.detail.data.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.firstname}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              {new Date(user.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <Pagination
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                      pageSize={pageSize}
                      totalItems={userData.detail.total_count}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
