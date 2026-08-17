const Pagination = ({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  disabled,
}) => {
  if (total === 0) {
    return null;
  }

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="pagination">
      <p className="pagination-info">
        Showing {start}–{end} of {total}
      </p>

      <div className="pagination-actions">
        <button
          type="button"
          className="btn btn-ghost"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>

        <span className="pagination-page">
          Page {page} / {totalPages}
        </span>

        <button
          type="button"
          className="btn btn-ghost"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
