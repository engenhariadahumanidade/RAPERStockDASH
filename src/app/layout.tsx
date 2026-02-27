import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Stock Analytics Pro Dashboard',
  description: 'A premium automated stock analysis dashboard',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-[#0f172a] text-slate-50 antialiased selection:bg-brand-500/30`}>
        <div className="min-h-screen relative flex flex-col">
          <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-8 relative z-10">
            {children}
          </main>
          {/* Background decorations */}
          <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-500/10 blur-[120px] pointer-events-none z-0" />
          <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-buy-500/10 blur-[120px] pointer-events-none z-0" />
        </div>
      </body>
    </html>
  );
}
