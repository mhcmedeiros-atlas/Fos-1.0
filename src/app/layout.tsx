import type { Metadata } from 'next';
import { Inter, Fraunces, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono-tabular' });

export const metadata: Metadata = {
  title: 'Fós',
  description: 'ERP para clínicas de estética avançada',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${fraunces.variable} ${mono.variable}`}>
        {children}
      </body>
    </html>
  );
}
