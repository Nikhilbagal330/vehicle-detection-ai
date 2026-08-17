const ViolationFilters = ({
  values,
  facets,
  onChange,
  onClear,
  hasActiveFilters,
}) => {
  const updateField = (field, value) => {
    onChange({
      ...values,
      [field]: value,
    });
  };

  return (
    <section className="search-filters" aria-label="Search filters">
      <div className="search-grid">
        <label className="date-field">
          <span>Camera</span>
          <input
            type="text"
            list="camera-options"
            placeholder="e.g. cam_01"
            value={values.cameraId}
            onChange={(event) =>
              updateField("cameraId", event.target.value)
            }
          />
          <datalist id="camera-options">
            {facets.cameras.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </label>

        <label className="date-field">
          <span>Zone</span>
          <input
            type="text"
            list="zone-options"
            placeholder="e.g. no_parking_01"
            value={values.zoneId}
            onChange={(event) =>
              updateField("zoneId", event.target.value)
            }
          />
          <datalist id="zone-options">
            {facets.zones.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </label>

        <label className="date-field">
          <span>Status</span>
          <select
            value={values.status}
            onChange={(event) =>
              updateField("status", event.target.value)
            }
          >
            <option value="ALL">All</option>
            <option value="PENDING">Pending</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </label>

        <label className="date-field">
          <span>Vehicle type</span>
          <input
            type="text"
            list="vehicle-type-options"
            placeholder="e.g. car"
            value={values.vehicleType}
            onChange={(event) =>
              updateField("vehicleType", event.target.value)
            }
          />
          <datalist id="vehicle-type-options">
            {facets.vehicleTypes.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </label>

        <label className="date-field">
          <span>Plate number</span>
          <input
            type="text"
            placeholder="Search plate"
            value={values.plateNumber}
            onChange={(event) =>
              updateField(
                "plateNumber",
                event.target.value.toUpperCase()
              )
            }
          />
        </label>
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onClear}
        >
          Clear filters
        </button>
      )}
    </section>
  );
};

export default ViolationFilters;
