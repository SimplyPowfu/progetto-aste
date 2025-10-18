// app/layout.js
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '../../context/Providers'; // 1. Importa il NUOVO wrapper

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Sito Aste',
  description: 'Progetto di aste',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* 2. Avvolgi i 'children' con il wrapper "Providers" */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}