import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs';
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RAPERStock Dashboard',
  description: 'O seu terminal inteligente para análise e alertas de ações da B3.',
  icons: {
    icon: '/icon.svg',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth();

  // If user is logged in, check if they are in the AllowedUser table or are Admin
  if (userId) {
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;

    if (email) {
      const isAllowed = await prisma.allowedUser.findUnique({ where: { email } });
      const dbUser = await prisma.user.findUnique({ where: { email } });
      const isAdmin = dbUser?.isAdmin || email === "engenhariadahumanidade@gmail.com";

      // If not allowed and not admin, and not already on the unauthorized page
      // We can't easily check current path here without more complex logic, 
      // but the middleware should ideally handle this. 
      // As a fallback, we'll let the specific page handle it or redirect here.
    }
  }

  return (
    <ClerkProvider>
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
    </ClerkProvider>
  );
}
