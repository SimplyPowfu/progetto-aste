// app/crea-asta/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid'; 

export default function CreaAstaPage() {
  const [titolo, setTitolo] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [prezzoPartenza, setPrezzoPartenza] = useState(0);
  const [immagine, setImmagine] = useState(null); 
  const [error, setError] = useState(null);
  const [loadingForm, setLoadingForm] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const isAdmin = user && user.uid === process.env.NEXT_PUBLIC_ADMIN_USER_ID;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoadingForm(true);

    // --- MODIFICA: Il controllo sull'immagine è stato rimosso ---
    // Non è più obbligatoria

    if (prezzoPartenza <= 0) {
      setError('Il prezzo di partenza deve essere maggiore di 0');
      setLoadingForm(false);
      return;
    }

    try {
      let imageUrl = null; // Default a null
      let imagePath = null; // Default a null

      // --- MODIFICA: Esegui l'upload SOLO se l'immagine è stata fornita ---
      if (immagine) {
        const uniqueFileName = `${uuidv4()}-${immagine.name}`;

        const response = await fetch(
          `/api/upload?filename=${encodeURIComponent(uniqueFileName)}`, 
          {
            method: 'POST',
            body: immagine, 
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Fallimento chiamata API upload');
        }

        const newBlob = await response.json();
        imageUrl = newBlob.url; // Imposta l'URL solo se l'upload è avvenuto
        imagePath = newBlob.pathname; 
      }
      // --- Fine Blocco Modifica ---

      // I campi imageUrl e imagePath saranno 'null' se non è stata caricata un'immagine
      const docRef = await addDoc(collection(db, 'auctions'), {
        titolo: titolo,
        descrizione: descrizione,
        prezzoPartenza: Number(prezzoPartenza),
        prezzoCorrente: Number(prezzoPartenza), 
        creataIl: serverTimestamp(),
        creataDa: user.uid,
        stato: 'attiva', 
        imageUrl: imageUrl, 
        imagePath: imagePath, 
      });
      
      console.log('Asta creata con ID: ', docRef.id);
      setTitolo('');
      setDescrizione('');
      setPrezzoPartenza(0);
      setImmagine(null); 
      e.target.reset(); 
      router.push('/'); 

    } catch (err) {
      console.error('Errore creazione asta:', err);
      setError(`Errore durante la creazione dell'asta: ${err.message}. Riprova.`);
    } finally {
      setLoadingForm(false);
    }
  };

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
            required // Il titolo rimane obbligatorio
          />
        </div>

        <div>
          <label htmlFor="immagine" className="font-semibold">Immagine Asta (Opzionale)</label>
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
            // --- MODIFICA: Rimosso 'required' ---
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
            required // La descrizione rimane obbligatoria
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
            required // Il prezzo rimane obbligatorio
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