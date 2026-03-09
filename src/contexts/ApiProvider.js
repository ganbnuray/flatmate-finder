/**
 * @fileoverview ApiContext provider — injects a single FlatmateApiClient
 * instance into the React tree via context.
 *
 * The instance is created with useMemo so the same object reference is used
 * on every render. A new reference on every render would cause any useEffect
 * that lists `api` as a dependency to fire in an infinite loop.
 */

import { createContext, useContext, useMemo } from 'react';
import FlatmateApiClient from '../FlatmateApiClient';

const ApiContext = createContext(null);

/**
 * Provides a memoized FlatmateApiClient instance to all descendant components.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components that need API access.
 * @returns {JSX.Element} The context provider wrapping children.
 */
export default function ApiProvider({ children }) {
  const api = useMemo(() => new FlatmateApiClient(), []);

  return (
    <ApiContext.Provider value={api}>
      {children}
    </ApiContext.Provider>
  );
}

/**
 * Returns the FlatmateApiClient instance from the nearest ApiProvider.
 *
 * Only pages and contexts should call this hook. Components receive data
 * through props instead.
 *
 * @returns {FlatmateApiClient} The shared API client instance.
 */
export function useApi() {
  return useContext(ApiContext);
}
