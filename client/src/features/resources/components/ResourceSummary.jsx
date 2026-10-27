import Badge from '../../../components/ui/Badge.jsx';

/**
 * Summarizes currently active search filters and results count.
 *
 * @param {object} props
 * @param {number} props.total
 * @param {object} props.filters
 * @param {(field: string) => void} props.onRemoveFilter
 * @param {() => void} props.onClearAll
 */
export default function ResourceSummary({ total = 0, filters = {}, onRemoveFilter, onClearAll }) {
  const activeChips = [];

  if (filters.search) {
    activeChips.push({
      key: 'search',
      label: `Keyword: "${filters.search}"`,
    });
  }

  if (filters.category) {
    activeChips.push({
      key: 'category',
      label: `Category: ${filters.category}`,
    });
  }

  if (filters.location) {
    activeChips.push({
      key: 'location',
      label: `Location: "${filters.location}"`,
    });
  }

  if (filters.minCapacity) {
    activeChips.push({
      key: 'minCapacity',
      label: `Min Capacity: ${filters.minCapacity}`,
    });
  }

  if (filters.maxCapacity) {
    activeChips.push({
      key: 'maxCapacity',
      label: `Max Capacity: ${filters.maxCapacity}`,
    });
  }

  return (
    <div className="resource-summary" aria-live="polite">
      <div className="resource-summary__count">
        Found <strong>{total}</strong> active resource{total === 1 ? '' : 's'}
      </div>

      {activeChips.length > 0 && (
        <div className="resource-summary__chips">
          <span className="resource-summary__chips-label">Active filters:</span>
          {activeChips.map((chip) => (
            <span key={chip.key} className="resource-summary__chip">
              <Badge variant="neutral" size="sm">
                {chip.label}
                <button
                  type="button"
                  className="resource-summary__chip-remove"
                  onClick={() => onRemoveFilter(chip.key)}
                  aria-label={`Remove filter ${chip.label}`}
                >
                  ×
                </button>
              </Badge>
            </span>
          ))}

          <button
            type="button"
            className="resource-summary__clear-all-link"
            onClick={onClearAll}
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
