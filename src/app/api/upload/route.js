// app/api/upload/route.js
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request) {
  // L'immagine arriva come "searchParams" nell'URL
  // (es. /api/upload?filename=miafoto.jpg)
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename) {
    return NextResponse.json(
      { error: "Nessun nome file fornito." },
      { status: 400 }
    );
  }

  // request.body è lo stream del file
  try {
    const blob = await put(filename, request.body, {
      access: 'public', // Rende il file pubblicamente accessibile
      // Specifica un percorso (opzionale ma consigliato)
      pathname: `aste/${filename}`, 
    });

    // Ritorna il blob (che contiene l'URL) al client
    return NextResponse.json(blob);

  } catch (error) {
    console.error("Errore upload Vercel Blob:", error);
    return NextResponse.json(
      { error: "Errore durante il caricamento del file." },
      { status: 500 }
    );
  }
}