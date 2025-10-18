// app/login/page.js
'use client';

import { useState } from 'react';
import { auth } from '../../../lib/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      console.log('Utente registrato!');
      router.push('/');
    } catch (err) {
      setError(err.message);
      console.error(err);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('Utente loggato!');
      router.push('/');
    } catch (err) {
      setError(err.message);
      console.error(err);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      console.log('Utente loggato con Google!');
      router.push('/');
    } catch (err) {
      setError(err.message);
      console.error(err);
    }
  };

  // Stile aggiornato per avere testo nero ovunque
  const inputStyle = "w-full p-2 border border-gray-300 rounded mt-1 text-gray-600 placeholder-gray-500";
  const buttonStyle = "w-full p-2 rounded text-white mt-4";

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md text-black">
        <h2 className="text-2xl font-bold text-center text-black">Accedi</h2>

        <form className="space-y-4">
          <div>
            <label className="text-black">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Inserisci la tua email"
              className={inputStyle}
              required
            />
          </div>
          <div>
            <label className="text-black">Password (almeno 6 caratteri):</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Inserisci la tua password"
              className={inputStyle}
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex space-x-4">
            <button
              onClick={handleSignIn}
              className={`${buttonStyle} bg-blue-500 hover:bg-blue-600`}
            >
              Accedi
            </button>
            <button
              onClick={handleSignUp}
              className={`${buttonStyle} bg-green-500 hover:bg-green-600`}
            >
              Registrati
            </button>
          </div>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Oppure</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          className={`${buttonStyle} bg-red-500 hover:bg-red-600`}
        >
          Accedi con Google
        </button>
      </div>
    </div>
  );
}