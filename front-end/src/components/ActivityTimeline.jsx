import { useEffect, useState } from "react";

import { getViolationActivities } from "../api/violationApi";

const ACTION_LABELS = {
  VERIFIED: "Verified",
  REJECTED: "Rejected",
  PLATE_UPDATED: "Plate updated",
};

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString();
};

const formatDetails = (activity) => {
  if (activity.action === "PLATE_UPDATED") {
    return `${activity.details?.previousPlate || "—"} → ${
      activity.details?.newPlate || "—"
    }`;
  }

  if (activity.action === "REJECTED" && activity.note) {
    return activity.note;
  }

  if (activity.details?.previousStatus) {
    return `${activity.details.previousStatus} → ${activity.details.newStatus}`;
  }

  return null;
};

const ActivityTimeline = ({ violationId, refreshKey = 0 }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!violationId) {
      setActivities([]);
      return;
    }

    let active = true;

    const load = async () => {
      setLoading(true);

      try {
        const result = await getViolationActivities(violationId);

        if (active) {
          setActivities(result.data || []);
        }
      } catch {
        if (active) {
          setActivities([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [violationId, refreshKey]);

  return (
    <section className="activity-block">
      <h3>Admin activity</h3>

      {loading ? (
        <p className="evidence-missing">Loading activity…</p>
      ) : activities.length === 0 ? (
        <p className="evidence-missing">No admin actions yet.</p>
      ) : (
        <ul className="activity-list">
          {activities.map((activity) => {
            const actor =
              activity.performedBy?.name ||
              activity.performedBy?.email ||
              "Admin";
            const detail = formatDetails(activity);

            return (
              <li key={activity._id} className="activity-item">
                <div className="activity-top">
                  <span
                    className={`activity-action action-${String(
                      activity.action
                    )
                      .toLowerCase()
                      .replace(/_/g, "-")}`}
                  >
                    {ACTION_LABELS[activity.action] || activity.action}
                  </span>
                  <span className="activity-time">
                    {formatDate(activity.createdAt)}
                  </span>
                </div>
                <p className="activity-actor">by {actor}</p>
                {detail && <p className="activity-detail">{detail}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default ActivityTimeline;
