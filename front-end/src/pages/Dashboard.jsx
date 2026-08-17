import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Layout from "../components/Layout";
import Pagination from "../components/Pagination";
import StatCards from "../components/StatCards";
import StatsChart from "../components/StatsChart";
import ViolationDetail from "../components/ViolationDetail";
import ViolationFilters from "../components/ViolationFilters";
import ViolationTable from "../components/ViolationTable";
import { useAuth } from "../context/AuthContext";
import {
  getStatsTimeline,
  getViolations,
  updatePlateNumber,
  updateViolationStatus,
} from "../api/violationApi";

const POLL_INTERVAL_MS = 5000;
const SEARCH_DEBOUNCE_MS = 350;
const PAGE_SIZE = 10;

const emptyStats = {
  total: 0,
  pending: 0,
  verified: 0,
  rejected: 0,
};

const emptyPagination = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 1,
};

const emptyFacets = {
  cameras: [],
  zones: [],
  vehicleTypes: [],
};

const emptySearch = {
  cameraId: "",
  zoneId: "",
  status: "ALL",
  vehicleType: "",
  plateNumber: "",
};

const Dashboard = () => {
  const { user } = useAuth();
  const hasLoadedOnce = useRef(false);

  const [violations, setViolations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState(emptySearch);
  const [appliedSearch, setAppliedSearch] = useState(emptySearch);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(emptyPagination);
  const [stats, setStats] = useState(emptyStats);
  const [facets, setFacets] = useState(emptyFacets);
  const [chartRange, setChartRange] = useState("7d");
  const [chartSeries, setChartSeries] = useState([]);
  const [chartLabel, setChartLabel] = useState("Last 7 days");
  const [chartLoading, setChartLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [activityRefreshKey, setActivityRefreshKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedSearch(search);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [search]);

  const queryParams = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      status: appliedSearch.status,
      ...(appliedSearch.cameraId.trim()
        ? { cameraId: appliedSearch.cameraId.trim() }
        : {}),
      ...(appliedSearch.zoneId.trim()
        ? { zoneId: appliedSearch.zoneId.trim() }
        : {}),
      ...(appliedSearch.vehicleType.trim()
        ? { vehicleType: appliedSearch.vehicleType.trim() }
        : {}),
      ...(appliedSearch.plateNumber.trim()
        ? { plateNumber: appliedSearch.plateNumber.trim() }
        : {}),
      ...(fromDate ? { from: fromDate } : {}),
      ...(toDate ? { to: toDate } : {}),
    }),
    [page, appliedSearch, fromDate, toDate]
  );

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        search.cameraId ||
          search.zoneId ||
          search.vehicleType ||
          search.plateNumber ||
          search.status !== "ALL" ||
          fromDate ||
          toDate
      ),
    [search, fromDate, toDate]
  );

  const loadViolations = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent && !hasLoadedOnce.current) {
        setInitialLoading(true);
      }

      try {
        const result = await getViolations(queryParams);
        const list = result.data || [];

        setViolations(list);
        setPagination(result.pagination || emptyPagination);
        setStats(result.stats || emptyStats);
        setFacets(result.facets || emptyFacets);
        setError("");

        setSelectedId((current) => {
          if (current && list.some((item) => item._id === current)) {
            return current;
          }

          if (silent && current) {
            return current;
          }

          return list[0]?._id || null;
        });
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load violations"
        );
      } finally {
        hasLoadedOnce.current = true;
        setInitialLoading(false);
      }
    },
    [queryParams]
  );

  useEffect(() => {
    loadViolations({ silent: hasLoadedOnce.current });

    const timer = setInterval(() => {
      loadViolations({ silent: true });
    }, POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [loadViolations]);

  const loadChart = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setChartLoading(true);
      }

      try {
        const result = await getStatsTimeline(chartRange);
        setChartSeries(result.data?.series || []);
        setChartLabel(result.data?.label || "");
      } catch {
        if (!silent) {
          setChartSeries([]);
        }
      } finally {
        setChartLoading(false);
      }
    },
    [chartRange]
  );

  useEffect(() => {
    loadChart({ silent: chartSeries.length > 0 });

    const timer = setInterval(() => {
      loadChart({ silent: true });
    }, POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [loadChart]);

  const selected = useMemo(
    () => violations.find((item) => item._id === selectedId) || null,
    [violations, selectedId]
  );

  const handleSearchChange = (nextSearch) => {
    setSearch(nextSearch);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch(emptySearch);
    setAppliedSearch(emptySearch);
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  const handleFromDate = (value) => {
    setFromDate(value);
    setPage(1);
  };

  const handleToDate = (value) => {
    setToDate(value);
    setPage(1);
  };

  const handleVerify = async (id) => {
    setBusy(true);
    setError("");

    try {
      await updateViolationStatus(id, {
        status: "VERIFIED",
        verifiedBy: user?.name || user?.email,
      });

      await loadViolations({ silent: true });
      setActivityRefreshKey((value) => value + 1);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to verify violation"
      );
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async (id, rejectionReason) => {
    setBusy(true);
    setError("");

    try {
      await updateViolationStatus(id, {
        status: "REJECTED",
        verifiedBy: user?.name || user?.email,
        rejectionReason: rejectionReason || undefined,
      });

      await loadViolations({ silent: true });
      setActivityRefreshKey((value) => value + 1);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to reject violation"
      );
    } finally {
      setBusy(false);
    }
  };

  const handleSavePlate = async (id, plateNumber) => {
    setBusy(true);
    setError("");

    try {
      await updatePlateNumber(id, plateNumber);
      await loadViolations({ silent: true });
      setActivityRefreshKey((value) => value + 1);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to update plate number"
      );
      throw err;
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout>
      <div className="dashboard">
        <div className="dashboard-header">
          <div>
            <h1>Violations dashboard</h1>
            <p className="dashboard-subtitle">
              Live no-parking events from camera detection.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => loadViolations({ silent: true })}
            disabled={initialLoading || busy}
          >
            Refresh
          </button>
        </div>

        <StatCards stats={stats} />

        <StatsChart
          range={chartRange}
          onRangeChange={setChartRange}
          series={chartSeries}
          label={chartLabel}
          loading={chartLoading && chartSeries.length === 0}
        />

        {error && <p className="form-error banner-error">{error}</p>}

        <ViolationFilters
          values={search}
          facets={facets}
          onChange={handleSearchChange}
          onClear={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
        />

        <div className="toolbar">
          <div className="date-filters">
            <label className="date-field">
              <span>From</span>
              <input
                type="date"
                value={fromDate}
                onChange={(event) => handleFromDate(event.target.value)}
              />
            </label>

            <label className="date-field">
              <span>To</span>
              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(event) => handleToDate(event.target.value)}
              />
            </label>
          </div>
        </div>

        {initialLoading ? (
          <p className="loading-copy">Loading violations…</p>
        ) : (
          <div className="dashboard-grid">
            <div className="table-panel">
              <ViolationTable
                violations={violations}
                selectedId={selectedId}
                onSelect={(item) => setSelectedId(item._id)}
              />
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                limit={pagination.limit}
                disabled={busy}
                onPageChange={setPage}
              />
            </div>

              <ViolationDetail
                violation={selected}
                onVerify={handleVerify}
                onReject={handleReject}
                onSavePlate={handleSavePlate}
                busy={busy}
                activityRefreshKey={activityRefreshKey}
              />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
