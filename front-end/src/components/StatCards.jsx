const StatCards = ({ stats }) => {
  const items = [
    { key: "total", label: "Total", value: stats.total },
    { key: "pending", label: "Pending", value: stats.pending },
    { key: "verified", label: "Verified", value: stats.verified },
    { key: "rejected", label: "Rejected", value: stats.rejected },
  ];

  return (
    <section className="stat-grid" aria-label="Violation summary">
      {items.map((item) => (
        <article key={item.key} className={`stat-card stat-${item.key}`}>
          <p className="stat-label">{item.label}</p>
          <p className="stat-value">{item.value}</p>
        </article>
      ))}
    </section>
  );
};

export default StatCards;
