import ResourceCard from './ResourceCard.jsx';
import EmptyState from '../../../components/ui/EmptyState.jsx';
import Button from '../../../components/ui/Button.jsx';

/**
 * Resource Grid & Pagination Component
 *
 * Renders resource cards in a responsive CSS grid, handles loading skeleton cards,
 * displays empty states, and exposes pagination controls.
 *
 * @param {object} props
 * @param {Array<object>} props.resources
 * @param {boolean} props.isLoading
 * @param {object} props.pagination
 * @param {(newPage: number) => void} props.onPageChange
 * @param {() => void} props.onResetFilters
 */
export default function ResourceGrid({
  resources = [],
  isLoading = false,
  pagination = {},
  onPageChange,
  onResetFilters,
}) {
  const { page = 1, total = 0, totalPages = 1, hasNextPage = false, hasPrevPage = false } =
    pagination || {};

  // Skeleton loading placeholders
  if (isLoading) {
    return (
      <div className="resource-grid" aria-busy="true" aria-label="Loading resources">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="resource-card resource-card--skeleton">
            <div className="skeleton skeleton--badge" />
            <div className="skeleton skeleton--title" />
            <div className="skeleton skeleton--text" />
            <div className="skeleton skeleton--text" style={{ width: '70%' }} />
            <div className="skeleton skeleton--button" />
          </div>
        ))}
      </div>
    );
  }

  // Empty state when no resources match
  if (!resources || resources.length === 0) {
    return (
      <EmptyState
        title="No matching resources"
        description="We couldn't find any campus facilities matching your current filter criteria. Try searching with different keywords, removing category filters, or widening capacity ranges."
        action={
          onResetFilters && (
            <Button variant="primary" size="md" onClick={onResetFilters}>
              Reset All Filters
            </Button>
          )
        }
      />
    );
  }

  return (
    <div className="resource-grid-container">
      <div className="resource-grid" role="region" aria-label="Available campus resources">
        {resources.map((resource) => (
          <ResourceCard key={resource._id} resource={resource} />
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <nav
          className="resource-pagination"
          aria-label="Resource catalog pagination"
        >
          <div className="resource-pagination__summary">
            Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total resources)
          </div>

          <div className="resource-pagination__controls">
            <Button
              variant="outline"
              size="sm"
              disabled={!hasPrevPage}
              onClick={() => onPageChange(page - 1)}
              aria-label="Go to previous page"
            >
              Previous
            </Button>

            <span className="resource-pagination__page-indicator" aria-current="page">
              {page}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={!hasNextPage}
              onClick={() => onPageChange(page + 1)}
              aria-label="Go to next page"
            >
              Next
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
}
