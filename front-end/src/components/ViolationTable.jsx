import StatusBadge from "./StatusBadge";

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleString();
};

const ViolationTable = ({
  violations,
  selectedId,
  onSelect,
}) => {
  if (!violations.length) {
    return (
      <div className="empty-state">
        No violations match this filter.
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="violation-table">
        <thead>
          <tr>
            <th>Plate</th>
            <th>Camera</th>
            <th>Zone</th>
            <th>Duration</th>
            <th>Status</th>
            <th>Detected</th>
          </tr>
        </thead>
        <tbody>
          {violations.map((item) => (
            <tr
              key={item._id}
              className={
                selectedId === item._id ? "is-selected" : ""
              }
              onClick={() => onSelect(item)}
            >
              <td className="mono">{item.plateNumber}</td>
              <td>{item.cameraId}</td>
              <td>{item.zoneId}</td>
              <td>{item.duration}s</td>
              <td>
                <StatusBadge status={item.status} />
              </td>
              <td>{formatDate(item.detectedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ViolationTable;
