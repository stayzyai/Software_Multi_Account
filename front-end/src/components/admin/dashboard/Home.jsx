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
import api from "@/api/api";

const Home = ({ setOpenModal }) => {
  const [userData, setUserData] = useState(null);
  const [userError, setUserError] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [statsData, setStatsData] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const fetchUserData = useCallback(async () => {
    setUserLoading(true);
    try {
      const response = await api.get(
        `/user/all-users?page=${currentPage}&page_size=${pageSize}`
      );
      setUserData(response.data);
    } catch (error) {
      setUserError(error.message);
    } finally {
      setUserLoading(false);
    }
  }, [currentPage, pageSize]);

  const fetchStatsData = async () => {
    setStatsLoading(true);
    try {
      const response = await api.get("/admin/get-statistics");
      setStatsData(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setStatsLoading(false);
    }
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
              ) : statsData ? (
                <>
                  <StatCard
                    title="Total Automated Messages"
                    icon={
                      <BarChart className="h-4 w-4 text-muted-foreground" />
                    }
                    stats={statsData.DashboardStats.automatedMessages}
                  />
                  <StatCard
                    title="Total Users"
                    icon={<Users className="h-4 w-4 text-muted-foreground" />}
                    stats={statsData.DashboardStats.users}
                  />
                  <StatCard
                    title="Total Tickets Generated"
                    icon={<Ticket className="h-4 w-4 text-muted-foreground" />}
                    stats={statsData.DashboardStats.tickets}
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
