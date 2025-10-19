// app/crea-asta/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function CreaAstaPage() {
  // --- 1. STATO DEL FORM ---
  const [titolo, setTitolo] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [prezzoPartenza, setPrezzoPartenza] = useState(0);
  const [error, setError] = useState(null);
  const [loadingForm, setLoadingForm] = useState(false);

  // --- 2. CONTROLLO AUTENTICAZIONE ---
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Controlliamo se l'utente loggato è l'admin
  const isAdmin = user && user.uid === process.env.NEXT_PUBLIC_ADMIN_USER_ID;

  // --- 3. LOGICA DI INVIO FORM ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoadingForm(true);

    if (prezzoPartenza <= 0) {
      setError('Il prezzo di partenza deve essere maggiore di 0');
      setLoadingForm(false);
      return;
    }

    try {
      // Creiamo un nuovo documento nella collezione 'auctions'
      const docRef = await addDoc(collection(db, 'auctions'), {
        titolo: titolo,
        descrizione: descrizione,
        prezzoPartenza: Number(prezzoPartenza),
        prezzoCorrente: Number(prezzoPartenza), // All'inizio è uguale
        creataIl: serverTimestamp(),
        creataDa: user.uid,
        stato: 'attiva', // Stato iniziale dell'asta
        //se vogliamo aggiungere campi vanno inizializzati qui =P
      });
      
      console.log('Asta creata con ID: ', docRef.id);
      // Svuotiamo il form e torniamo alla homepage
      setTitolo('');
      setDescrizione('');
      setPrezzoPartenza(0);
      router.push('/'); // Reindirizza alla homepage

    } catch (err) {
      console.error('Errore creazione asta:', err);
      setError('Errore durante la creazione dell\'asta. Riprova.');
      // Le nostre regole di Firestore dovrebbero bloccare questo,
      // ma è una doppia sicurezza.
      if (err.code === 'permission-denied') {
        setError('Errore: non hai i permessi per creare un\'asta.');
      }
    } finally {
      setLoadingForm(false);
    }
  };

  // --- 4. GESTIONE ACCESSO PAGINA ---
  // Se sta ancora caricando i dati dell'utente, aspetta
  if (authLoading) {
    return <div className="text-center p-10">Caricamento...</div>;
  }

  // Se l'utente NON è admin, blocca l'accesso
  if (!isAdmin) {
    // Reindirizziamo o mostriamo un errore.
    // Per ora mostriamo un errore, è più semplice.
    return (
      <div className="text-center p-10 text-red-500 font-bold">
        <h1>Accesso Negato</h1>
        <p>Non hai i permessi per visualizzare questa pagina.</p>
      </div>
    );
  }

  // --- 5. RENDER DEL FORM (solo se è admin) ---
  const inputStyle = "w-full p-2 border border-gray-300 rounded mt-1";
  
  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Crea una Nuova Asta</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="titolo" className="font-semibold">Titolo Asta</label>
          <input
            type="text"
            id="titolo"
            value={titolo}
            onChange={(e) => setTitolo(e.target.value)}
            className={inputStyle}
            required
          />
        </div>

        <div>
          <label htmlFor="descrizione" className="font-semibold">Descrizione</label>
          <textarea
            id="descrizione"
            value={descrizione}
            onChange={(e) => setDescrizione(e.target.value)}
            className={inputStyle}
            rows="4"
            required
          />
        </div>

        <div>
          <label htmlFor="prezzo" className="font-semibold">Prezzo di Partenza (€)</label>
          <input
            type="number"
            id="prezzo"
            value={prezzoPartenza}
            onChange={(e) => setPrezzoPartenza(e.target.value)}
            className={inputStyle}
            min="1"
            required
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button 
          type="submit" 
          disabled={loadingForm}
          className="w-full p-3 bg-green-500 text-white rounded font-bold hover:bg-green-600 disabled:bg-gray-400"
        >
          {loadingForm ? 'Creazione in corso...' : 'Pubblica Asta'}
        </button>
      </form>
    </div>
  );
}