import { useRef, useCallback } from 'react';

/**
 * Custom hook to handle scrolling to the latest validation accordion
 * Works for both local state validations and API-loaded validations
 */
export function useValidationScroll() {
  const validationRefs = useRef({});

  /**
   * Register a ref for a validation item
   */
  const registerValidationRef = useCallback((validationId, element) => {
    if (element) {
      validationRefs.current[validationId] = element;
    } else {
      // Clean up ref if element is removed
      delete validationRefs.current[validationId];
    }
  }, []);

  /**
   * Scroll to the latest validation (last in the list, as API returns data in ascending order)
   * @param {string|null} latestValidationId - The ID of the latest validation (optional if you want to use data attribute)
   * @param {Function|null} setExpandedValidation - Function to set the expanded validation (optional if already set)
   * @param {number} delay - Delay in milliseconds before scrolling (default: 200)
   */
  const scrollToLatestValidation = useCallback((latestValidationId, setExpandedValidation, delay = 200) => {
    // Expand the latest validation if ID and setter are provided
    // Note: For VerSolicitud, expansion is set before calling this function
    if (latestValidationId && setExpandedValidation) {
      setExpandedValidation(latestValidationId);
    }

    // Then scroll to it after a delay to ensure DOM is updated
    setTimeout(() => {
      // Try to find the last validation element by data attribute (most reliable)
      const validationElements = document.querySelectorAll('[data-validation-item]');
      
      if (validationElements.length > 0) {
        const lastElement = validationElements[validationElements.length - 1];
        lastElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      // Fallback: try using refs with the provided ID
      if (latestValidationId) {
        const latestValidationRef = validationRefs.current[latestValidationId];
        if (latestValidationRef) {
          latestValidationRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }

      // Final fallback: try to find any validation by refs and get the last one
      const validationIds = Object.keys(validationRefs.current);
      
      if (validationIds.length > 0) {
        // Get the last validation ID (assuming refs are in order)
        const lastValidationId = validationIds[validationIds.length - 1];
        const lastValidationRef = validationRefs.current[lastValidationId];
        if (lastValidationRef) {
          lastValidationRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }
    }, delay);
  }, []);

  /**
   * Get the ref callback for a validation item
   */
  const getValidationRef = useCallback((validationId) => {
    return (element) => registerValidationRef(validationId, element);
  }, [registerValidationRef]);

  return {
    validationRefs,
    registerValidationRef,
    scrollToLatestValidation,
    getValidationRef,
  };
}
