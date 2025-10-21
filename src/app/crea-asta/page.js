// app/crea-asta/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid'; // Per i nomi unici dei file

export default function CreaAstaPage() {
  // --- 1. STATO DEL FORM ---
  const [titolo, setTitolo] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [prezzoPartenza, setPrezzoPartenza] = useState(0);
  const [immagine, setImmagine] = useState(null); // Stato per il file immagine
  const [error, setError] = useState(null);
  const [loadingForm, setLoadingForm] = useState(false);

  // --- 2. CONTROLLO AUTENTICAZIONE ---
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Controlliamo se l'utente loggato è l'admin
  const isAdmin = user && user.uid === process.env.NEXT_PUBLIC_ADMIN_USER_ID;

  // --- 3. LOGICA DI INVIO FORM (AGGIORNATA PER VERCEL BLOB) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoadingForm(true);

    // Controlli di validazione (immagine e prezzo)
    if (!immagine) {
      setError('Devi caricare un\'immagine per l\'asta.');
      setLoadingForm(false);
      return;
    }
    if (prezzoPartenza <= 0) {
      setError('Il prezzo di partenza deve essere maggiore di 0');
      setLoadingForm(false);
      return;
    }

    try {
      // --- Logica di Upload su Vercel Blob ---
      
      // 1. Diamo un nome unico al file
      const uniqueFileName = `${uuidv4()}-${immagine.name}`;

      // 2. Chiamiamo la nostra API Route (/api/upload)
      // Il nome del file viene passato come parametro URL
      const response = await fetch(
        `/api/upload?filename=${encodeURIComponent(uniqueFileName)}`, 
        {
          method: 'POST',
          body: immagine, // Invia il file grezzo nel body
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fallimento chiamata API upload');
      }

      // 3. Prendiamo l'URL dal risultato
      const newBlob = await response.json();
      const imageUrl = newBlob.url; // Questo è il nostro URL pubblico!
      // --- Fine Blocco Vercel Blob ---


      // 4. Creiamo il documento su Firestore (come prima)
      const docRef = await addDoc(collection(db, 'auctions'), {
        titolo: titolo,
        descrizione: descrizione,
        prezzoPartenza: Number(prezzoPartenza),
        prezzoCorrente: Number(prezzoPartenza), 
        creataIl: serverTimestamp(),
        creataDa: user.uid,
        stato: 'attiva', 
        imageUrl: imageUrl, // <-- L'URL di Vercel Blob
        imagePath: newBlob.pathname, // (utile per cancellare in futuro)
      });
      
      console.log('Asta creata con ID: ', docRef.id);
      // Svuotiamo il form
      setTitolo('');
      setDescrizione('');
      setPrezzoPartenza(0);
      setImmagine(null); 
      e.target.reset(); // Svuota l'input file
      router.push('/'); 

    } catch (err) {
      console.error('Errore creazione asta:', err);
      setError(`Errore durante la creazione dell'asta: ${err.message}. Riprova.`);
    } finally {
      setLoadingForm(false);
    }
  };

  // --- 4. GESTIONE ACCESSO PAGINA ---
  if (authLoading) {
    return <div className="text-center p-10">Caricamento...</div>;
  }

  if (!isAdmin) {
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
          <label htmlFor="immagine" className="font-semibold">Immagine Asta</label>
          <input
            type="file"
            id="immagine"
            accept="image/png, image/jpeg"
            onChange={(e) => setImmagine(e.target.files[0])}
            className="w-full p-2 border border-gray-300 rounded mt-1 file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
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