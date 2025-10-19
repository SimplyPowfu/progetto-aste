// app/layout.js
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '../../context/Providers';
import Navbar from '../../components/Navbar'; // 1. Importa la Navbar

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Sito Aste',
  description: 'Progetto di aste',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={inter.className}>
        <Providers>
          
          <Navbar /> {/* 2. Aggiungi la Navbar qui */}
          
          <main className="p-4"> {/* 3. Aggiunto <main> per separare i contenuti */}
            {children}
          </main>

        </Providers>
      </body>
    </html>
  );
}