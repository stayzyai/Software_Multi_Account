const StatusBadge = ({ status, type = "status" }) => {
  const styles = {
    status: {
      completed: "bg-green-100 text-green-700",
      delayed: "bg-yellow-100 text-yellow-700",
      "at risk": "bg-red-100 text-red-700",
    },
    occupancy: {
      occupied: "bg-green-100 text-green-700",
      vacant: "bg-orange-100 text-orange-700",
    },
  };

  const getStyle = () =>
    styles[type][status.toLowerCase()] || "bg-gray-50 text-gray-700";

  return (
    <span className={`px-2 py-0.5 ${getStyle()} rounded-full text-xs`}>
      {status}
    </span>
  );
};

export default StatusBadge;
