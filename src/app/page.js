// app/page.js
'use client'; // Fondamentale: dice a Next.js di eseguire questo codice nel browser

import { useEffect } from 'react';
import { auth, db } from '../../lib/firebase'; // Importiamo la nostra configurazione
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function Home() {
  
  // Questo hook esegue il codice solo una volta, 
  // appena la pagina viene caricata nel browser
  useEffect(() => {
    
    console.log('Inizio test di connessione Firebase...');

    const testConnection = async () => {
      try {
        // --- TEST 1: AUTENTICAZIONE ---
        console.log('Test 1: Autenticazione anonima...');
        const userCredential = await signInAnonymously(auth);
        console.log('✅ Auth OK. Utente anonimo:', userCredential.user.uid);

        // --- TEST 2: SCRITTURA FIRESTORE ---
        console.log('Test 2: Scrittura su Firestore...');
        
        // Creiamo un riferimento a un documento (es. /test/connection-check)
        const testDocRef = doc(db, 'test', 'connection-check');
        
        // Scriviamo un documento
        await setDoc(testDocRef, {
          message: 'Connessione riuscita!',
          timestamp: serverTimestamp(),
        });
        
        console.log('✅ Firestore OK. Documento scritto!');
        console.log('🎉🎉🎉 COMPLIMENTI! La connessione a Firebase è configurata correttamente.');

      } catch (error) {
        console.error('❌ ERRORE DI CONNESSIONE:', error.code, error.message);
        if (error.code === 'permission-denied') {
          console.error('ERRORE SPECIFICO: Permesso negato. Hai aggiornato le Regole di Firestore?');
        }
      }
    };

    testConnection();

  }, []); // L'array vuoto significa "esegui solo una volta"

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Test Connessione Firebase</h1>
      <p>Apri la console del browser per vedere i risultati del test.</p>
    </main>
  );
}