// context/Providers.js
'use client';

import { AuthProvider } from './AuthContext';

// Questo componente wrapper gira sul client
// e può quindi usare tutti i provider che vogliamo.
export function Providers({ children }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}