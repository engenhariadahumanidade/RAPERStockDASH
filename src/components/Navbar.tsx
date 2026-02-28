'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { Shield, Users, Activity, LayoutDashboard, Settings as SettingsIcon, WalletCards, Clock, RefreshCw } from 'lucide-react';

export default function Navbar() {
    const pathname = usePathname();
    const { user: clerkUser } = useUser();
    const isAdmin = clerkUser?.primaryEmailAddress?.emailAddress === "engenhariadahumanidade@gmail.com";

    const [now, setNow] = useState(new Date());
    const [nextScan, setNextScan] = useState<Date | null>(null);

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const fetchInterval = async () => {
            try {
                const res = await fetch('/api/settings');
                const data = await res.json();
                if (data && data.scanInterval) {
                    const ms = data.scanInterval * 60 * 1000;
                    setNextScan(new Date(Date.now() + ms));
                }
            } catch (e) {
                console.error("Failed to fetch scan interval for navbar", e);
            }
        };
        fetchInterval();
        // Refresh interval every 5 mins to keep nextScan somewhat accurate even if dashboard isn't active
        const refreshMeta = setInterval(fetchInterval, 5 * 60 * 1000);
        return () => clearInterval(refreshMeta);
    }, []);

    const navs = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Minha Carteira', href: '/manage', icon: WalletCards },
        { name: 'Configurações', href: '/settings', icon: SettingsIcon },
    ];

    if (isAdmin) {
        navs.push({ name: 'Admin', href: '/admin', icon: Shield });
    }

    return (
        <nav className="flex flex-col lg:flex-row items-center justify-between p-4 mb-6 glass rounded-2xl shadow-xl shadow-black/50 border border-slate-700 gap-4 transition-all">
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-tr from-brand-600 to-brand-500 rounded-xl shadow-lg shadow-brand-500/20">
                        <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-sm font-black tracking-tight text-white whitespace-nowrap">
                            RAPERStock Dashboard <span className="text-brand-400">({clerkUser?.emailAddresses[0]?.emailAddress?.split('@')[0] || "Investidor"})</span>
                        </h1>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-0.5">
                            v4.2.3 • Dashboard & Escaneamento
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-slate-950/40 px-3 py-1.5 rounded-xl border border-slate-800/50">
                    <div className="flex flex-col items-center sm:items-end">
                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-tighter flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" /> Local
                        </span>
                        <span className="text-xs font-mono text-slate-200 font-bold">{now.toLocaleTimeString('pt-BR')}</span>
                    </div>
                    <div className="w-px h-6 bg-slate-800 hidden sm:block"></div>
                    <div className="flex flex-col items-center sm:items-end">
                        <span className="text-[9px] text-brand-500/80 font-black uppercase tracking-tighter flex items-center gap-1">
                            <RefreshCw className="w-2.5 h-2.5" /> Scan
                        </span>
                        <span className="text-xs font-mono text-brand-400 font-bold">{nextScan ? nextScan.toLocaleTimeString('pt-BR') : '--:--:--'}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 justify-center">
                <div className="flex gap-1.5">
                    {navs.map((nav) => {
                        const isActive = pathname === nav.href;
                        const Icon = nav.icon;
                        return (
                            <Link
                                key={nav.name}
                                href={nav.href}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all duration-300 font-bold text-xs whitespace-nowrap
                        ${isActive
                                        ? 'bg-slate-700/60 text-white shadow-inner border border-slate-600 cursor-default'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/80 cursor-pointer'}
                    `}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                <span className="">{nav.name}</span>
                            </Link>
                        );
                    })}
                </div>

                <div className="flex items-center gap-3 ml-2 pl-2 border-l border-slate-800">
                    <SignedIn>
                        <UserButton afterSignOutUrl="/" appearance={{
                            elements: {
                                avatarBox: "w-8 h-8 rounded-lg border border-slate-700 shadow-md"
                            }
                        }} />
                    </SignedIn>
                    <SignedOut>
                        <SignInButton mode="modal">
                            <button className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-bold transition-all shadow-lg shadow-brand-500/20 text-xs">
                                Entrar
                            </button>
                        </SignInButton>
                    </SignedOut>
                </div>
            </div>
        </nav>
    );
}
