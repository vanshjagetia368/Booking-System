import { useState, useEffect } from 'react';

/**
 * Resource Search Input Component
 *
 * Provides accessible text search across resource name, description, and location.
 * Debounces search input changes to prevent excessive API requests.
 *
 * @param {object} props
 * @param {string} props.value - Current search query
 * @param {(query: string) => void} props.onChange - Search value change handler
 * @param {string} [props.placeholder='Search resources by name, room number, or equipment...']
 */
export default function ResourceSearch({
  value = '',
  onChange,
  placeholder = 'Search by resource name, building, room, or equipment...',
}) {
  const [searchTerm, setSearchTerm] = useState(value);

  // Sync internal state when external value changes (e.g. on filter reset)
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Debounce user keystrokes by 350ms before notifying parent
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== value) {
        onChange(searchTerm);
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [searchTerm, value, onChange]);

  const handleClear = () => {
    setSearchTerm('');
    onChange('');
  };

  return (
    <div className="resource-search">
      <label htmlFor="resource-search-input" className="sr-only">
        Search resources
      </label>
      <div className="resource-search__input-wrapper">
        <span className="resource-search__icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            width="20"
            height="20"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
        </span>
        <input
          id="resource-search-input"
          type="search"
          className="resource-search__input"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          maxLength={100}
          autoComplete="off"
        />
        {searchTerm && (
          <button
            type="button"
            className="resource-search__clear-btn"
            onClick={handleClear}
            aria-label="Clear search input"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              width="18"
              height="18"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
