import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

/**
 * Custom hook to access the global authentication context.
 *
 * @throws {Error} If called outside of an AuthProvider tree.
 * @returns {import('../context/AuthContext.jsx').AuthContextValue}
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return context;
}

export default useAuth;
