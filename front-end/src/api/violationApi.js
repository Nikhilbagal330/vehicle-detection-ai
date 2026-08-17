import api from "./client";

export const getViolations = async (params = {}) => {
  const response = await api.get("/api/violations", {
    params,
  });

  return response.data;
};

export const getViolationById = async (id) => {
  const response = await api.get(`/api/violations/${id}`);
  return response.data;
};

export const updateViolationStatus = async (
  id,
  { status, verifiedBy, rejectionReason }
) => {
  const response = await api.patch(`/api/violations/${id}/status`, {
    status,
    verifiedBy,
    rejectionReason,
  });

  return response.data;
};

export const updatePlateNumber = async (id, plateNumber) => {
  const response = await api.patch(`/api/violations/${id}/plate`, {
    plateNumber,
  });

  return response.data;
};

export const getStatsTimeline = async (range = "7d") => {
  const response = await api.get("/api/violations/stats/timeline", {
    params: { range },
  });

  return response.data;
};

export const getViolationActivities = async (id) => {
  const response = await api.get(`/api/violations/${id}/activities`);
  return response.data;
};
