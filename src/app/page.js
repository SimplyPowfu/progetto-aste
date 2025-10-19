// app/page.js
'use client';

import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import Link from 'next/link'; 
import { useAuth } from '../../context/AuthContext'; 
import { useRouter } from 'next/navigation'; 

// --- MODIFICA 1: FilterBar ora accetta 'isAdmin' ---
function FilterBar({ currentFilter, setFilter, isAdmin }) {
  const baseStyle = "px-4 py-2 rounded-lg cursor-pointer transition-colors duration-200";
  const activeStyle = "bg-blue-600 text-white font-semibold";
  const inactiveStyle = "bg-gray-200 text-gray-700 hover:bg-gray-300";

  return (
    <div className="flex flex-wrap gap-2 mb-6 p-2 bg-gray-100 rounded-lg w-full">
      {/* Filtri Admin */}
      {isAdmin && (
        <button
          onClick={() => setFilter('tutte')}
          className={`${baseStyle} ${currentFilter === 'tutte' ? activeStyle : inactiveStyle}`}
        >
          Tutte le Aste
        </button>
      )}

      {/* Filtri Comuni */}
      <button
        onClick={() => setFilter('attiva')}
        className={`${baseStyle} ${currentFilter === 'attiva' ? activeStyle : inactiveStyle}`}
      >
        Aste Attive
      </button>
      <button
        onClick={() => setFilter('chiusa')}
        className={`${baseStyle} ${currentFilter === 'chiusa' ? activeStyle : inactiveStyle}`}
      >
        Aste Chiuse
      </button>
      
      {/* Filtro Utente Normale */}
      {!isAdmin && (
        <button
          onClick={() => setFilter('vinte')}
          className={`${baseStyle} ${currentFilter === 'vinte' ? activeStyle : inactiveStyle}`}
        >
          Le mie Aste Vinte
        </button>
      )}
    </div>
  );
}


// --- Componente Home Principale ---
export default function Home() {
  const [aste, setAste] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, loading: authLoading } = useAuth();
  
  // --- MODIFICA 2: Gestione Filtro Default ---
  const [filter, setFilter] = useState('attiva');
  const isAdmin = user && user.uid === process.env.NEXT_PUBLIC_ADMIN_USER_ID;

  // Imposta il filtro di default appena sappiamo chi è l'utente
  useEffect(() => {
    if (authLoading) return; // Aspetta
    if (isAdmin) {
      setFilter('tutte');
    } else {
      setFilter('attiva');
    }
  }, [isAdmin, authLoading]);
  
  // --- MODIFICA 3: Logica Query Unificata ---
  useEffect(() => {
    if (authLoading || !filter) return; 

    setLoading(true);
    setError(null);
    
    const asteCollectionRef = collection(db, 'auctions');
    let q; 

    // La query ora dipende SOLO dal filtro
    switch (filter) {
      case 'tutte':
        q = query(asteCollectionRef, orderBy('creataIl', 'desc'));
        break;
      case 'attiva':
        q = query(asteCollectionRef, where('stato', '==', 'attiva'), orderBy('creataIl', 'desc'));
        break;
      case 'chiusa':
        q = query(asteCollectionRef, where('stato', '==', 'chiusa'), orderBy('creataIl', 'desc'));
        break;
      case 'vinte':
        if (user) {
          q = query(asteCollectionRef, where('vincitoreId', '==', user.uid), orderBy('creataIl', 'desc'));
        }
        break;
      default:
        // Ospite o default
        q = query(asteCollectionRef, where('stato', '==', 'attiva'), orderBy('creataIl', 'desc'));
    }

    if (!q) {
      setLoading(false);
      setAste([]);
      return; 
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const asteList = querySnapshot.docs.map(doc => ({
        id: doc.id,   
        ...doc.data() 
      }));
      setAste(asteList);
      setLoading(false); 
    }, (err) => {
      console.error("Errore nel listener delle aste:", err);
      setError("Impossibile caricare le aste.");
      if (err.code === 'failed-precondition') {
        setError("Errore: un indice Firestore necessario non è stato trovato. Controlla la console F12 per il link di creazione.");
      }
      setLoading(false);
    });

    return () => unsubscribe();
    
  }, [user, authLoading, filter]); // Ricarica su cambio utente o filtro


  // --- Render ---
  if (loading || authLoading) {
    return <div className="text-center p-10">Caricamento...</div>;
  }
  
  if (error) {
    return <div className="text-center p-10 text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Aste</h1>

      {/* --- MODIFICA 4: Mostra filtri a TUTTI gli utenti loggati --- */}
      {user && (
        <FilterBar 
          currentFilter={filter} 
          setFilter={setFilter} 
          isAdmin={isAdmin} 
        />
      )}

      {aste.length === 0 && (
        <p>Nessuna asta trovata per questa categoria.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {aste.map(asta => (
          <AstaCard 
            key={asta.id} 
            asta={asta} 
            user={user} 
            isAdmin={isAdmin}
            currentFilter={filter}
          />
        ))}
      </div>
    </div>
  );
}


// --- Componente AstaCard (invariato dall'ultima versione) ---
function AstaCard({ asta, user, isAdmin, currentFilter }) {
  const router = useRouter();

  const handleClick = () => {
    if (!user) {
      router.push('/login');
    } else {
      router.push(`/asta/${asta.id}`);
    }
  };

  let badgeText = null;
  let badgeClass = 'bg-red-600'; 

  if (asta.stato === 'chiusa') {
    if (currentFilter === 'vinte' && !isAdmin) {
      badgeText = 'VINTA';
      badgeClass = 'bg-green-600';
    } else {
      badgeText = 'CHIUSA';
    }
  }

  return (
    <div 
      onClick={handleClick}
      className="border rounded-lg shadow-lg overflow-hidden
                 hover:shadow-xl transition-shadow duration-200
                 flex flex-col h-full cursor-pointer relative"
    >
      
      {badgeText && (
        <div className={`absolute top-2 right-2 text-white
                        text-xs font-bold px-2 py-1 rounded-full z-10 ${badgeClass}`}>
          {badgeText}
        </div>
      )}
      
      <div className="h-48 bg-gray-200 flex items-center justify-center">
        <span className="text-gray-500">(Immagine Asta)</span>
      </div>
      
      <div className="p-4 flex-grow">
        <h3 className="text-xl font-semibold mb-2">{asta.titolo}</h3>
      </div>
      
      <div className="p-4 bg-gray-50 border-t">
        <p className="text-sm text-gray-500">
          {asta.stato === 'attiva' ? 'Prezzo Corrente:' : 'Prezzo Finale:'}
        </p>
        <p className={`text-2xl font-bold ${asta.stato === 'attiva' ? 'text-green-600' : 'text-gray-700'}`}>
          {asta.prezzoCorrente} €
        </p>
      </div>
    </div>
  );
}