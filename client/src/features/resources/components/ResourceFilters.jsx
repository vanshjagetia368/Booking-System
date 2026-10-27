import { useState } from 'react';
import Button from '../../../components/ui/Button.jsx';
import FormField from '../../../components/forms/FormField.jsx';
import Select from '../../../components/forms/Select.jsx';
import Input from '../../../components/forms/Input.jsx';

/**
 * Filter and Sorting Controls for Resource Discovery
 *
 * Exposes only query parameters supported and validated by the Express API.
 *
 * @param {object} props
 * @param {object} props.filters - Current filter values
 * @param {(filters: object) => void} props.onChange - Filter change handler
 * @param {() => void} props.onReset - Filter reset handler
 */
export default function ResourceFilters({ filters, onChange, onReset }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'study-room', label: 'Study Rooms' },
    { value: 'meeting-room', label: 'Meeting Rooms' },
    { value: 'lab-equipment', label: 'Lab Equipment' },
    { value: 'other', label: 'Other Spaces' },
  ];

  const sortOptions = [
    { value: 'createdAt', label: 'Date Added' },
    { value: 'name', label: 'Resource Name' },
    { value: 'capacity', label: 'Seating / Capacity' },
    { value: 'slotDurationMinutes', label: 'Slot Duration' },
  ];

  const sortOrderOptions = [
    { value: 'desc', label: 'Descending' },
    { value: 'asc', label: 'Ascending' },
  ];

  const handleFieldChange = (field, value) => {
    onChange({
      ...filters,
      [field]: value,
    });
  };

  const hasActiveFilters = Boolean(
    filters.category ||
      filters.location ||
      filters.minCapacity ||
      filters.maxCapacity ||
      filters.sortBy !== 'createdAt' ||
      filters.sortOrder !== 'desc',
  );

  return (
    <div className="resource-filters">
      <div className="resource-filters__header">
        <div className="resource-filters__primary">
          {/* Category Quick Filter */}
          <div className="resource-filters__control">
            <Select
              id="filter-category"
              name="category"
              value={filters.category || ''}
              onChange={(e) => handleFieldChange('category', e.target.value)}
              options={categoryOptions}
              aria-label="Filter by resource category"
            />
          </div>

          {/* Quick Sort Options */}
          <div className="resource-filters__control">
            <Select
              id="filter-sortBy"
              name="sortBy"
              value={filters.sortBy || 'createdAt'}
              onChange={(e) => handleFieldChange('sortBy', e.target.value)}
              options={sortOptions}
              aria-label="Sort resources by field"
            />
          </div>

          <div className="resource-filters__control resource-filters__control--order">
            <Select
              id="filter-sortOrder"
              name="sortOrder"
              value={filters.sortOrder || 'desc'}
              onChange={(e) => handleFieldChange('sortOrder', e.target.value)}
              options={sortOrderOptions}
              aria-label="Sort direction"
            />
          </div>
        </div>

        <div className="resource-filters__toggle-wrapper">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            aria-controls="advanced-filters-panel"
          >
            <span className="resource-filters__toggle-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
              </svg>
            </span>
            {isExpanded ? 'Fewer Filters' : 'More Filters'}
          </Button>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onReset}
              className="resource-filters__reset-btn"
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters Expandable Panel */}
      {isExpanded && (
        <div id="advanced-filters-panel" className="resource-filters__advanced">
          <div className="resource-filters__grid">
            {/* Location filter */}
            <FormField
              id="filter-location"
              label="Location / Building"
              helperText="e.g. Science Complex, Library 2nd Floor"
            >
              <Input
                id="filter-location"
                name="location"
                type="text"
                placeholder="Building or room name"
                value={filters.location || ''}
                onChange={(e) => handleFieldChange('location', e.target.value)}
                maxLength={100}
              />
            </FormField>

            {/* Minimum Capacity */}
            <FormField
              id="filter-minCapacity"
              label="Minimum Capacity"
              helperText="Minimum number of seats or attendees"
            >
              <Input
                id="filter-minCapacity"
                name="minCapacity"
                type="number"
                min="1"
                placeholder="e.g. 4"
                value={filters.minCapacity || ''}
                onChange={(e) => handleFieldChange('minCapacity', e.target.value)}
              />
            </FormField>

            {/* Maximum Capacity */}
            <FormField
              id="filter-maxCapacity"
              label="Maximum Capacity"
              helperText="Upper seating limit"
            >
              <Input
                id="filter-maxCapacity"
                name="maxCapacity"
                type="number"
                min="1"
                placeholder="e.g. 50"
                value={filters.maxCapacity || ''}
                onChange={(e) => handleFieldChange('maxCapacity', e.target.value)}
              />
            </FormField>
          </div>
        </div>
      )}
    </div>
  );
}
