// app/api/delete-image/route.js
import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request) {
  // Riceviamo il percorso del file dal body
  const { path } = await request.json();

  if (!path) {
    return NextResponse.json(
      { error: "Nessun percorso file fornito." },
      { status: 400 }
    );
  }

  try {
    // Usiamo la funzione 'del' di Vercel Blob
    await del(path);

    // Se tutto va bene, rispondiamo con successo
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Errore cancellazione Vercel Blob:", error);
    return NextResponse.json(
      { error: "Errore durante la cancellazione del file." },
      { status: 500 }
    );
  }
}