import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const RANGE_OPTIONS = [
  { id: "1d", label: "1 day" },
  { id: "7d", label: "7 days" },
  { id: "1m", label: "1 month" },
  { id: "3m", label: "3 months" },
  { id: "6m", label: "6 months" },
];

const StatsChart = ({
  range,
  onRangeChange,
  series,
  label,
  loading,
}) => {
  const hasData = series.some((item) => item.total > 0);

  return (
    <section className="stats-chart-panel">
      <div className="stats-chart-header">
        <div>
          <h2>Violation trends</h2>
          <p className="stats-chart-subtitle">
            {label || "Day-wise violation counts"}
          </p>
        </div>

        <div className="range-row" role="tablist" aria-label="Chart timespan">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={range === option.id}
              className={
                range === option.id
                  ? "filter-chip is-active"
                  : "filter-chip"
              }
              onClick={() => onRangeChange(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="stats-chart-body">
        {loading ? (
          <p className="loading-copy">Loading chart…</p>
        ) : !hasData ? (
          <p className="empty-state">
            No violations in this timespan yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3544" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#8b9aab", fontSize: 11 }}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#8b9aab", fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  background: "#171d25",
                  border: "1px solid #2a3544",
                  borderRadius: 10,
                }}
                labelStyle={{ color: "#e8eef5" }}
              />
              <Legend />
              <Bar
                dataKey="pending"
                stackId="status"
                fill="#c9851a"
                name="Pending"
              />
              <Bar
                dataKey="verified"
                stackId="status"
                fill="#2f9e6b"
                name="Verified"
              />
              <Bar
                dataKey="rejected"
                stackId="status"
                fill="#d64545"
                name="Rejected"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
};

export default StatsChart;
