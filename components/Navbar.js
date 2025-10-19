// components/Navbar.js
'use client';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, loading } = useAuth(); // Prendiamo l'utente dal nostro Context
  const router = useRouter();

  // --- NUOVA MODIFICA ---
  // Controlliamo se l'utente loggato corrisponde all'ID admin nel .env.local
  const isAdmin = user && user.uid === process.env.NEXT_PUBLIC_ADMIN_USER_ID;
  // --- FINE MODIFICA ---

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Il logout viene gestito dal listener in AuthContext,
      // ma potremmo voler reindirizzare l'utente
      router.push('/');
      console.log('Utente sloggato');
    } catch (error) {
      console.error('Errore durante il logout:', error);
    }
  };

  return (
    <nav className="flex items-center justify-between p-4 bg-white shadow-md">
      <div className="text-lg font-bold">
        <Link href="/">Sito Aste</Link>
      </div>
      <div className="flex items-center space-x-4">
        {/* Gestione dello stato di caricamento */}
        {loading && <p>Caricamento...</p>}
        
        {/* Se l'utente NON è loggato */}
        {!loading && !user && (
          <Link href="/login" className="px-3 py-2 text-white bg-blue-500 rounded hover:bg-blue-600">
            Login
          </Link>
        )}
        
        {/* Se l'utente È loggato */}
        {!loading && user && (
          <>
            {/* --- NUOVA MODIFICA --- */}
            {/* Mostra questo link solo se l'utente è admin */}
            {isAdmin && (
              <Link href="/crea-asta" className="px-3 py-2 text-white bg-green-500 rounded hover:bg-green-600">
                + Crea Asta
              </Link>
            )}
            {/* --- FINE MODIFICA --- */}

            <button 
              onClick={handleLogout} 
              className="px-3 py-2 text-white bg-red-500 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}