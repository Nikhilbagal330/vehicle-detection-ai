import { useEffect, useState } from "react";

import ActivityTimeline from "./ActivityTimeline";
import StatusBadge from "./StatusBadge";
import { getEvidenceUrl } from "../utils/evidenceUrl";

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleString();
};

const EvidenceImage = ({ label, path }) => {
  const [failed, setFailed] = useState(false);
  const src = getEvidenceUrl(path);

  if (!src) {
    return (
      <div className="evidence-row">
        <span className="evidence-label">{label}</span>
        <p className="evidence-missing">Not available</p>
      </div>
    );
  }

  return (
    <div className="evidence-row">
      <span className="evidence-label">{label}</span>
      {failed ? (
        <p className="evidence-missing">
          Image could not be loaded
        </p>
      ) : (
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="evidence-image-link"
        >
          <img
            src={src}
            alt={`${label} evidence`}
            className="evidence-image"
            onError={() => setFailed(true)}
          />
        </a>
      )}
    </div>
  );
};

const ViolationDetail = ({
  violation,
  onVerify,
  onReject,
  onSavePlate,
  busy,
  activityRefreshKey = 0,
}) => {
  const [reason, setReason] = useState("");
  const [plateDraft, setPlateDraft] = useState("");
  const [editingPlate, setEditingPlate] = useState(false);

  useEffect(() => {
    setReason("");
    setEditingPlate(false);
    setPlateDraft(violation?.plateNumber || "");
  }, [violation?._id, violation?.plateNumber]);

  if (!violation) {
    return (
      <aside className="detail-panel">
        <p className="detail-empty">
          Select a violation to review evidence and update status.
        </p>
      </aside>
    );
  }

  const isPending = violation.status === "PENDING";

  const handleSavePlate = async () => {
    await onSavePlate(violation._id, plateDraft);
    setEditingPlate(false);
  };

  return (
    <aside className="detail-panel">
      <div className="detail-header">
        <div className="plate-header">
          <p className="detail-kicker">Plate</p>

          {editingPlate ? (
            <div className="plate-edit">
              <input
                type="text"
                className="plate-input"
                value={plateDraft}
                onChange={(event) =>
                  setPlateDraft(event.target.value.toUpperCase())
                }
                placeholder="Enter plate number"
                disabled={busy}
                autoFocus
              />
              <div className="action-row">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy || !plateDraft.trim()}
                  onClick={handleSavePlate}
                >
                  Save plate
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={busy}
                  onClick={() => {
                    setPlateDraft(violation.plateNumber || "");
                    setEditingPlate(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="plate-display">
              <h2 className="detail-plate">
                {violation.plateNumber || "UNKNOWN"}
              </h2>
              <button
                type="button"
                className="btn btn-ghost btn-small"
                disabled={busy}
                onClick={() => setEditingPlate(true)}
              >
                {violation.plateNumber ? "Edit plate" : "Add plate"}
              </button>
            </div>
          )}
        </div>
        <StatusBadge status={violation.status} />
      </div>

      <dl className="detail-meta">
        <div>
          <dt>Camera</dt>
          <dd>{violation.cameraId}</dd>
        </div>
        <div>
          <dt>Zone</dt>
          <dd>{violation.zoneId}</dd>
        </div>
        <div>
          <dt>Vehicle ID</dt>
          <dd>{violation.vehicleId}</dd>
        </div>
        <div>
          <dt>Duration</dt>
          <dd>{violation.duration}s</dd>
        </div>
        <div>
          <dt>Type</dt>
          <dd>{violation.violationType}</dd>
        </div>
        <div>
          <dt>Detected</dt>
          <dd>{formatDate(violation.detectedAt)}</dd>
        </div>
      </dl>

      <section className="evidence-block">
        <h3>Evidence</h3>
        <EvidenceImage
          label="Plate"
          path={violation.evidence?.plateImage}
        />
        <EvidenceImage
          label="Vehicle"
          path={violation.evidence?.vehicleImage}
        />
        <EvidenceImage
          label="Full frame"
          path={violation.evidence?.fullImage}
        />
      </section>

      {isPending && (
        <section className="detail-actions">
          <label className="field">
            <span>Rejection reason</span>
            <input
              type="text"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Optional if rejecting"
              disabled={busy}
            />
          </label>

          <div className="action-row">
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={() => onVerify(violation._id)}
            >
              Verify
            </button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={busy}
              onClick={() => onReject(violation._id, reason)}
            >
              Reject
            </button>
          </div>
        </section>
      )}

      {!isPending && (
        <p className="detail-note">
          Reviewed by {violation.verifiedBy || "unknown"} on{" "}
          {formatDate(violation.verifiedAt)}
          {violation.rejectionReason
            ? ` — ${violation.rejectionReason}`
            : ""}
        </p>
      )}

      <ActivityTimeline
        violationId={violation._id}
        refreshKey={activityRefreshKey}
      />
    </aside>
  );
};

export default ViolationDetail;
