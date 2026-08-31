import type { Metadata } from 'next';
import { Manrope, Fraunces, JetBrains_Mono } from 'next/font/google';
import './globals.css';

// As três famílias do design system Fós. Carregadas por next/font em vez do
// @import do Google que vinha no token de tipografia: evita request bloqueante
// e o flash de fonte na primeira renderização.
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains' });

export const metadata: Metadata = {
  title: 'Fós',
  description: 'ERP para clínicas de estética avançada',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${manrope.variable} ${fraunces.variable} ${jetbrains.variable}`}>
        {children}
      </body>
    </html>
  );
}
