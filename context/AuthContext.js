// context/AuthContext.js
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase'; // Il nostro file di config!

// 1. Creiamo il contesto
const AuthContext = createContext();

// 2. Creiamo il "Provider" (il componente che fornirà i dati)
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Stato di caricamento iniziale

  useEffect(() => {
    // onAuthStateChanged è un "listener" di Firebase
    // Si attiva ogni volta che lo stato di login cambia (login, logout)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // L'utente si è loggato
        setUser(user);
      } else {
        // L'utente si è sloggato
        setUser(null);
      }
      setLoading(false); // Finito il caricamento iniziale
    });

    // Puliamo il listener quando il componente si smonta
    return () => unsubscribe();
  }, []);

  // Forniamo 'user' e 'loading' a tutti i componenti figli
  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Creiamo un "Hook" personalizzato per usarloAuthContext.js facilmente
export const useAuth = () => useContext(AuthContext);