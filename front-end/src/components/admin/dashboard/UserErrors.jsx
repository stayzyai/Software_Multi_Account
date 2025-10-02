import { useState, useEffect } from "react";
import { getUserTimezone } from "../../../helpers/Message";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react";
import api from "@/api/api";
import { toast } from "sonner";

export default function UserErrors({ userId, userName, isOpen, onClose }) {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserErrors();
    }
  }, [isOpen, userId]);

  const fetchUserErrors = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/user-errors/${userId}`);
      setUserInfo(response.data.detail);
      setErrors(response.data.detail.errors || []);
    } catch (err) {
      toast.error("Failed to fetch user errors");
      console.error("Error fetching user errors:", err);
    } finally {
      setLoading(false);
    }
  };

  const resolveError = async (errorId) => {
    try {
      await api.post(`/admin/resolve-error/${errorId}`);
      toast.success("Error marked as resolved");
      fetchUserErrors(); // Refresh the list
    } catch (err) {
      toast.error("Failed to resolve error");
      console.error("Error resolving error:", err);
    }
  };

  const getErrorIcon = (errorType) => {
    switch (errorType.toLowerCase()) {
      case "authentication":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "api":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case "data sync":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (isResolved) => {
    if (isResolved) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Resolved
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Unresolved
        </Badge>
      );
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-w-[95vw] w-full max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">User Error History</DialogTitle>
          <DialogDescription>
            Recent errors and issues for this user
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}

        {!loading && userInfo && (
          <div className="space-y-4">
            {/* User Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">User Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{userInfo.user_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{userInfo.user_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Errors</p>
                    <p className="font-medium">{userInfo.total_errors}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-medium text-green-600">{userInfo.status}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Errors List */}
            {errors.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-green-600">All Good! ✅</h3>
                  <p className="text-gray-600">No errors found for this user</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Errors</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Endpoint</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {errors.map((error) => (
                        <TableRow key={error.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getErrorIcon(error.error_type)}
                              <span className="font-medium">{error.error_type}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              <p className="text-sm truncate" title={error.error_message}>
                                {error.error_message}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {error.endpoint || "N/A"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {new Date(error.created_at).toLocaleDateString('en-US', {
                                timeZone: getUserTimezone(),
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(error.is_resolved)}
                          </TableCell>
                          <TableCell>
                            {!error.is_resolved && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => resolveError(error.id)}
                                className="text-green-600 border-green-200 hover:bg-green-50"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Resolve
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

