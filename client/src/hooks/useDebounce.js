import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce any fast-changing value (such as search input keystrokes).
 * Delays updating the debounced value until after the specified delay (default: 300ms)
 * has passed since the last time the source value changed.
 *
 * @template T
 * @param {T} value - The input value to debounce
 * @param {number} delay - Delay in milliseconds (default 300ms)
 * @returns {T} The debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up a timer to update debounced value after delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancel the timeout if value changes (or component unmounts) before delay expires
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
