// app/asta/[id]/page.js
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import { db } from '../../../../lib/firebase';
import {
  doc,
  onSnapshot,
  collection,
  addDoc,
  serverTimestamp,
  runTransaction,
  updateDoc, 
  getDocs,
  query,
  orderBy
} from 'firebase/firestore';
import Link from 'next/link';

export default function AstaPage({ params }) {
  const { id: astaId } = use(params);
  const { user } = useAuth(); 
  const router = useRouter();

  const [asta, setAsta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [puntata, setPuntata] = useState(0);
  const [puntataError, setPuntataError] = useState(null);
  const [puntataLoading, setPuntataLoading] = useState(false);

  const isAdmin = user && user.uid === process.env.NEXT_PUBLIC_ADMIN_USER_ID;

  // Listener Real-Time
  useEffect(() => {
    if (!astaId) return;
    setLoading(true);
    const docRef = doc(db, 'auctions', astaId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAsta({ id: docSnap.id, ...data });
        if (data.stato === 'attiva') {
          setPuntata(Number(data.prezzoCorrente) + 1);
        }
        setError(null);
      } else {
        setError("Asta non trovata o eliminata.");
      }
      setLoading(false);
    }, (err) => {
      console.error("Errore nel listener:", err);
      setError("Impossibile caricare l'asta.");
      setLoading(false);
    });
    return () => unsubscribe();
  }, [astaId]);

  // Logica Puntata
  const handlePuntata = async (e) => {
    e.preventDefault();
    if (!user) { setPuntataError("Devi essere loggato per puntare"); return; }
    if (asta.stato !== 'attiva') { setPuntataError("Questa asta è chiusa."); return; }
    if (Number(puntata) <= asta.prezzoCorrente) { setPuntataError(`La tua puntata deve essere maggiore di ${asta.prezzoCorrente} €`); return; }
    setPuntataLoading(true); setPuntataError(null);
    try {
      const astaRef = doc(db, 'auctions', astaId);
      const bidsCollectionRef = collection(db, 'auctions', astaId, 'bids');
      await runTransaction(db, async (transaction) => {
        const astaDoc = await transaction.get(astaRef);
        if (!astaDoc.exists()) throw new Error("Asta non esiste!");
        const data = astaDoc.data();
        if (data.stato !== 'attiva') throw new Error("Asta chiusa!");
        const prezzoAttuale = data.prezzoCorrente;
        if (Number(puntata) <= prezzoAttuale) {
          throw new Error(`La tua puntata è troppo bassa! Il prezzo attuale è ${prezzoAttuale} €`);
        }
        transaction.update(astaRef, {
          prezzoCorrente: Number(puntata),
          ultimoOfferente: user.uid,
          emailOfferente: user.email, 
        });
        transaction.set(doc(bidsCollectionRef), {
          userId: user.uid,
          email: user.email,
          importo: Number(puntata),
          timestamp: serverTimestamp(),
        });
      });
    } catch (err) {
      console.error("Errore nella puntata:", err);
      setPuntataError(err.message);
    } finally {
      setPuntataLoading(false);
    }
  };

  // Logica Stop Asta (Admin)
  const handleStopAsta = async () => {
    if (!isAdmin || !asta) return;
    if (!confirm("Sei sicuro di voler terminare questa asta? L'azione è irreversibile.")) return;

    try {
      const astaRef = doc(db, 'auctions', astaId);
      await updateDoc(astaRef, {
        stato: 'chiusa',
        vincitoreId: asta.ultimoOfferente || null,
        vincitoreEmail: asta.emailOfferente || null
      });
    } catch (err) {
      console.error("Errore chiusura asta:", err);
      alert("Si è verificato un errore durante la chiusura.");
    }
  };

  // Render
  if (loading) return <div className="text-center p-10">Caricamento asta...</div>;
  if (error) return <div className="text-center p-10 text-red-500">{error}</div>;
  if (!asta) return null;
  
  const utenteLoggatoPuoPuntare = user && user.uid !== asta.ultimoOfferente;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <h1 className="text-4xl font-bold mb-4">{asta.titolo}</h1>
      {asta.imageUrl && (
        <div className="w-full h-80 rounded-lg overflow-hidden shadow-lg mb-6 bg-gray-200">
          <img 
            src={asta.imageUrl} 
            alt={asta.titolo}
            className="w-full h-full object-cover" 
          />
        </div>
      )}
      <p className="text-lg text-gray-700 mb-6">{asta.descrizione}</p>
      
      {/* Box Prezzo */}
      <div className="bg-gray-100 p-6 rounded-lg shadow-inner">
        <h2 className="text-xl text-gray-600">
          {asta.stato === 'attiva' ? 'Prezzo Corrente' : 'Prezzo Finale'}
        </h2>
        <p className={`text-6xl font-bold my-2 ${asta.stato === 'attiva' ? 'text-green-600' : 'text-gray-800'}`}>
          {asta.prezzoCorrente} €
        </p>
        <p className="text-gray-600">
          {asta.stato === 'attiva' ? 
            (asta.emailOfferente ? `Ultima puntata di: ${asta.emailOfferente}` : 'Nessuna puntata ancora') :
            (asta.vincitoreEmail ? `Vinta da: ${asta.vincitoreEmail}` : 'Nessun vincitore')
          }
        </p>
      </div>

      {/* Pannello Admin */}
      {isAdmin && (
        <div className="bg-blue-100 border border-blue-400 text-blue-800 p-4 rounded-lg shadow">
          <h3 className="text-xl font-bold mb-2">Pannello Amministrazione</h3>
          {asta.stato === 'attiva' && (
            <button
              onClick={handleStopAsta}
              className="px-4 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-700"
            >
              Ferma Asta Ora
            </button>
          )}
          {asta.stato === 'chiusa' && (
            <PannelloRisultatiAdmin asta={asta} vincitoreEmail={asta.vincitoreEmail} />
          )}
        </div>
      )}
      
      {/* --- INIZIO BLOCCO CORRETTO --- */}
      {/* Box Puntata (solo se attiva) */}
      {asta.stato === 'attiva' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-2xl font-semibold mb-4">Fai la tua puntata</h3>
          {!user ? (
            <p className="text-xl">
              <Link href="/login" className="text-blue-500 underline">Accedi</Link> per fare una puntata.
            </p>
          ) : (
            <form onSubmit={handlePuntata}>
              <label htmlFor="puntata" className="block text-lg font-medium">
                La tua offerta (min. {asta.prezzoCorrente + 1} €)
              </label>
              <div className="flex space-x-2 mt-2">
                <input
                  type="number"
                  id="puntata"
                  value={puntata}
                  onChange={(e) => setPuntata(e.target.value)}
                  className="flex-grow p-3 border border-gray-300 rounded-md text-lg"
                  min={asta.prezzoCorrente + 1}
                />
                <button
                  type="submit"
                  disabled={puntataLoading || !utenteLoggatoPuoPuntare}
                  className="p-3 bg-blue-500 text-white font-bold rounded-md hover:bg-blue-600
                            disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {puntataLoading ? 'Puntando...' : 'Punta'}
                </button>
              </div>
              {!utenteLoggatoPuoPuntare && user && (
                <p className="text-sm text-gray-500 mt-2">Sei già l'ultimo offerente.</p>
              )}
              {puntataError && <p className="text-red-500 mt-2">{puntataError}</p>}
            </form>
          )}
        </div>
      )}
      
      {/* Messaggio Asta Chiusa (per utenti normali) */}
      {asta.stato === 'chiusa' && !isAdmin && (
        <div className="bg-red-100 border border-red-400 text-red-800 p-6 rounded-lg shadow-md text-center">
          <h3 className="text-2xl font-bold">Asta Chiusa</h3>
          <p className="text-lg mt-2">Questa asta è terminata.</p>
        </div>
      )}
      {/* --- FINE BLOCCO CORRETTO --- */}
    </div>
  );
}


// --- Componente PannelloRisultatiAdmin (invariato) ---
function PannelloRisultatiAdmin({ asta, vincitoreEmail }) {
  const [perdenti, setPerdenti] = useState([]);
  const [cronologia, setCronologia] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [vincitore, setVincitore] = useState(null);

  const fetchRisultati = async () => {
    setLoading(true);
    setVincitore(vincitoreEmail || 'Nessun vincitore (nessuna puntata)');

    try {
      const bidsRef = collection(db, 'auctions', asta.id, 'bids');
      const querySnapshot = await getDocs(bidsRef);
      const emails = new Set();
      querySnapshot.forEach((doc) => {
        emails.add(doc.data().email);
      });
      if (vincitoreEmail) {
        emails.delete(vincitoreEmail);
      }
      setPerdenti(Array.from(emails));

      const historyQuery = query(bidsRef, orderBy('timestamp', 'desc'));
      const historySnapshot = await getDocs(historyQuery);
      const historyList = historySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCronologia(historyList);

    } catch (err) {
      console.error("Errore nel caricare i risultati:", err);
      alert("Errore caricamento risultati");
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '...';
    return new Date(timestamp.seconds * 1000).toLocaleString('it-IT');
  };

  return (
    <div>
      <h4 className="text-lg font-semibold">Risultati Asta (per invio email manuale)</h4>
      
      {!vincitore && (
        <button 
          onClick={fetchRisultati} 
          disabled={loading}
          className="mt-2 px-3 py-1 bg-green-600 text-white rounded disabled:bg-gray-400"
        >
          {loading ? 'Carico...' : 'Carica Vincitore/Perdenti e Cronologia'}
        </button>
      )}

      {vincitore && (
        <div className="mt-4 space-y-4">
          <div>
            <strong className="text-green-700">VINCITORE:</strong>
            <p className="select-all p-1 bg-white rounded">{vincitore}</p>
          </div>
          <div>
            <strong className="text-red-700">PERDENTI (Email uniche):</strong>
            {perdenti.length > 0 ? (
              <textarea 
                readOnly 
                value={perdenti.join('\n')} 
                className="w-full p-2 mt-1 border border-gray-300 rounded h-32 select-all" 
              />
            ) : (
              <p className="p-1 bg-white rounded">Nessun altro partecipante.</p>
            )}
          </div>
          <div>
            <strong className="text-blue-700">CRONOLOGIA PUNTATE (dalla più recente):</strong>
            <div className="max-h-60 overflow-y-auto bg-white rounded border border-gray-300 p-2 mt-1">
              {cronologia.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {cronologia.map(puntata => (
                    <li key={puntata.id} className="py-2">
                      <p className="font-semibold">{puntata.importo} €</p>
                      <p className="text-sm text-gray-600">{puntata.email}</p>
                      <p className="text-xs text-gray-400">{formatTimestamp(puntata.timestamp)}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Nessuna puntata registrata.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}