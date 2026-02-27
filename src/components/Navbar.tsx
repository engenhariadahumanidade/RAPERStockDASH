'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Settings as SettingsIcon, LayoutDashboard, WalletCards } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';

export default function Navbar() {
    const pathname = usePathname();

    const navs = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Minha Carteira', href: '/manage', icon: WalletCards },
        { name: 'Configurações', href: '/settings', icon: SettingsIcon },
    ];

    return (
        <nav className="flex items-center justify-between p-4 mb-8 glass rounded-2xl shadow-xl shadow-black/50 border border-slate-700">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-tr from-brand-600 to-brand-500 rounded-xl shadow-lg shadow-brand-500/20">
                    <Activity className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-white hidden md:block">
                    RAPERStock <span className="text-brand-400">Dashboard</span>
                </h1>
            </div>

            <div className="flex gap-2">
                {navs.map((nav) => {
                    const isActive = pathname === nav.href;
                    const Icon = nav.icon;
                    return (
                        <Link
                            key={nav.name}
                            href={nav.href}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 font-medium text-sm
                ${isActive
                                    ? 'bg-slate-700/50 text-white shadow-inner border border-slate-600 cursor-default'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80 cursor-pointer'}
              `}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{nav.name}</span>
                        </Link>
                    );
                })}
            </div>

            <div className="flex items-center gap-4">
                <SignedIn>
                    <UserButton afterSignOutUrl="/" appearance={{
                        elements: {
                            avatarBox: "w-10 h-10 rounded-xl border border-slate-600 shadow-lg"
                        }
                    }} />
                </SignedIn>
                <SignedOut>
                    <SignInButton mode="modal">
                        <button className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-brand-500/20 text-sm">
                            Entrar
                        </button>
                    </SignInButton>
                </SignedOut>
            </div>
        </nav>
    );
}
