const STATUS_LABELS = {
  PENDING: "Pending",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
};

const StatusBadge = ({ status }) => {
  const key = status || "PENDING";

  return (
    <span className={`status-badge status-${key.toLowerCase()}`}>
      {STATUS_LABELS[key] || key}
    </span>
  );
};

export default StatusBadge;
