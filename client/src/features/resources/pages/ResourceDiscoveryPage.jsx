import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import resourceService from '../services/resourceService.js';
import ResourceSearch from '../components/ResourceSearch.jsx';
import ResourceFilters from '../components/ResourceFilters.jsx';
import ResourceSummary from '../components/ResourceSummary.jsx';
import ResourceGrid from '../components/ResourceGrid.jsx';
import PageContainer from '../../../components/layout/PageContainer.jsx';
import ErrorState from '../../../components/feedback/ErrorState.jsx';
import { normalizeErrorMessage } from '../../../utils/error.js';

const DEFAULT_FILTERS = {
  search: '',
  category: '',
  location: '',
  minCapacity: '',
  maxCapacity: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  page: 1,
  limit: 12,
};

/**
 * Public Resource Discovery and Catalog Page
 *
 * Implements real-time filtering, debounced search, category selection,
 * capacity boundaries, sorting, and pagination against the Express API.
 */
export default function ResourceDiscoveryPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize filters from URL query parameters when present
  const [filters, setFilters] = useState(() => {
    return {
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      location: searchParams.get('location') || '',
      minCapacity: searchParams.get('minCapacity') || '',
      maxCapacity: searchParams.get('maxCapacity') || '',
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      page: Number(searchParams.get('page')) || 1,
      limit: 12,
    };
  });

  const [resources, setResources] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Request race-condition counter to ignore stale out-of-order network responses
  const latestRequestId = useRef(0);

  const fetchResources = useCallback(async (currentFilters) => {
    const requestId = ++latestRequestId.current;
    setIsLoading(true);
    setError(null);

    try {
      const data = await resourceService.listResources(currentFilters);

      // Only update state if this is still the most recent request
      if (requestId === latestRequestId.current) {
        setResources(data.resources);
        setPagination(data.pagination);
      }
    } catch (err) {
      if (requestId === latestRequestId.current) {
        setError(err);
      }
    } finally {
      if (requestId === latestRequestId.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Fetch when filters change
  useEffect(() => {
    fetchResources(filters);
  }, [filters, fetchResources]);

  // Synchronize filter state with URL search parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.category) params.set('category', filters.category);
    if (filters.location) params.set('location', filters.location);
    if (filters.minCapacity) params.set('minCapacity', filters.minCapacity);
    if (filters.maxCapacity) params.set('maxCapacity', filters.maxCapacity);
    if (filters.sortBy && filters.sortBy !== 'createdAt') params.set('sortBy', filters.sortBy);
    if (filters.sortOrder && filters.sortOrder !== 'desc') params.set('sortOrder', filters.sortOrder);
    if (filters.page && filters.page > 1) params.set('page', String(filters.page));

    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const handleSearchChange = (searchTerm) => {
    setFilters((prev) => ({
      ...prev,
      search: searchTerm,
      page: 1, // Reset to first page on search
    }));
  };

  const handleFiltersChange = (newFilters) => {
    setFilters({
      ...newFilters,
      page: 1, // Reset to first page on filter change
    });
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handleRemoveSingleFilter = (field) => {
    setFilters((prev) => ({
      ...prev,
      [field]: field === 'sortBy' ? 'createdAt' : field === 'sortOrder' ? 'desc' : '',
      page: 1,
    }));
  };

  return (
    <PageContainer size="xl" className="resource-discovery-page">
      {/* Hero / Header Section */}
      <header className="resource-discovery-page__hero">
        <h1 className="resource-discovery-page__title">
          Discover & Reserve University Resources
        </h1>
        <p className="resource-discovery-page__subtitle">
          Explore campus study rooms, collaborative meeting spaces, and research instruments.
          Check real-time slot availability and reserve facilities instantly.
        </p>
      </header>

      {/* Search and Filters Controls */}
      <section className="resource-discovery-page__controls" aria-label="Search and filter resources">
        <ResourceSearch
          value={filters.search}
          onChange={handleSearchChange}
        />

        <ResourceFilters
          filters={filters}
          onChange={handleFiltersChange}
          onReset={handleResetFilters}
        />

        <ResourceSummary
          total={pagination.total}
          filters={filters}
          onRemoveFilter={handleRemoveSingleFilter}
          onClearAll={handleResetFilters}
        />
      </section>

      {/* Main Results View */}
      <main className="resource-discovery-page__results" aria-label="Resource catalog">
        {error ? (
          <ErrorState
            error={error}
            title="Unable to load resources"
            message={normalizeErrorMessage(
              error,
              'Could not connect to the resource catalog. Please check your network or try again.',
            )}
            onRetry={() => fetchResources(filters)}
            retryLabel="Retry Catalog Search"
          />
        ) : (
          <ResourceGrid
            resources={resources}
            isLoading={isLoading}
            pagination={pagination}
            onPageChange={handlePageChange}
            onResetFilters={handleResetFilters}
          />
        )}
      </main>
    </PageContainer>
  );
}
