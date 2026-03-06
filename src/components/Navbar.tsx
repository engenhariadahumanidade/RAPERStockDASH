'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { Shield, Activity, LayoutDashboard, Settings as SettingsIcon, WalletCards, Clock, RefreshCw, Menu, X, ChevronUp } from 'lucide-react';

export default function Navbar() {
    const pathname = usePathname();
    const { user: clerkUser } = useUser();
    const isAdmin = clerkUser?.primaryEmailAddress?.emailAddress === "engenhariadahumanidade@gmail.com";

    const [now, setNow] = useState(new Date());
    const [nextScan, setNextScan] = useState<Date | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);

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
        const refreshMeta = setInterval(fetchInterval, 5 * 60 * 1000);
        return () => clearInterval(refreshMeta);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 300);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const navs = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Minha Carteira', href: '/manage', icon: WalletCards },
        { name: 'Configurações', href: '/settings', icon: SettingsIcon },
    ];

    if (isAdmin) {
        navs.push({ name: 'Admin', href: '/admin', icon: Shield });
    }

    return (
        <>
            <nav className={`lg:sticky lg:top-4 lg:mx-6 top-0 z-50 flex flex-col lg:flex-row items-center justify-between p-4 lg:px-6 mb-6 glass lg:rounded-2xl rounded-b-2xl shadow-2xl shadow-black/20 border-b lg:border border-white/5 gap-4 transition-all duration-300 ${isMenuOpen ? 'h-auto' : 'h-20 lg:h-auto overflow-hidden'}`}>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-between lg:w-auto min-h-[3rem] lg:min-h-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-tr from-brand-600 to-brand-500 rounded-xl shadow-lg shadow-brand-500/20">
                            <Activity className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-sm font-black tracking-tight text-white leading-tight">
                                RAPERStock Dashboard <br className="block sm:hidden" />
                                <span className="text-brand-400">({clerkUser?.emailAddresses[0]?.emailAddress?.split('@')[0] || "Investidor"})</span>
                            </h1>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-1 sm:mt-0.5">
                                v4.3.9 • Dashboard & Escaneamento
                            </p>
                        </div>
                    </div>

                    <div className="lg:hidden flex items-center absolute right-4 top-5">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 text-slate-400 hover:text-white transition-colors bg-slate-800/50 rounded-lg border border-slate-700/50"
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>

                    <div className="hidden lg:flex items-center gap-4 bg-slate-950/40 px-3 py-1.5 rounded-xl border border-slate-800/50">
                        <div className="flex flex-col items-center sm:items-end w-full sm:w-auto">
                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-tighter flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Local
                            </span>
                            <span className="text-sm font-mono text-slate-200 font-bold">{now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="w-px h-8 bg-slate-800 hidden sm:block"></div>
                        <div className="flex flex-col items-center sm:items-start w-full sm:w-auto">
                            <span className="text-[10px] text-brand-500/80 font-black uppercase tracking-tighter flex items-center gap-1">
                                <RefreshCw className="w-3 h-3" /> Scan
                            </span>
                            <span className="text-sm font-mono text-brand-400 font-bold">{nextScan ? nextScan.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                        </div>
                    </div>
                </div>

                {/* Mobile-only additional info (Time/Scan) inside the expanded menu */}
                {isMenuOpen && (
                    <div className="lg:hidden flex items-center gap-4 bg-slate-950/40 px-3 py-1.5 rounded-xl border border-slate-800/50 w-full justify-around mt-2">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-tighter flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Local
                            </span>
                            <span className="text-sm font-mono text-slate-200 font-bold">{now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="w-px h-8 bg-slate-800"></div>
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] text-brand-500/80 font-black uppercase tracking-tighter flex items-center gap-1">
                                <RefreshCw className="w-3 h-3" /> Scan
                            </span>
                            <span className="text-sm font-mono text-brand-400 font-bold">{nextScan ? nextScan.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                        </div>
                    </div>
                )}

                <div className={`flex flex-col lg:flex-row items-center lg:items-stretch gap-3 w-full lg:w-auto pt-3 lg:pt-0 border-t border-slate-800 lg:border-0 relative ${isMenuOpen ? 'flex' : 'hidden lg:flex'}`}>
                    <div className="flex flex-col sm:flex-row w-full lg:w-auto pb-2 sm:pb-0 justify-start sm:justify-center gap-2">
                        {navs.map((nav) => {
                            const isActive = pathname === nav.href;
                            const Icon = nav.icon;
                            return (
                                <Link
                                    key={nav.name}
                                    href={nav.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`flex items-center justify-center sm:justify-start gap-2 px-4 py-3 sm:py-2 rounded-xl transition-all duration-300 font-bold text-sm sm:text-xs whitespace-nowrap
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

                    <div className="flex items-center justify-between sm:justify-center w-full sm:w-auto gap-4 pl-0 sm:pl-4 border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0">
                        <SignedIn>
                            <UserButton afterSignOutUrl="/" appearance={{
                                elements: {
                                    avatarBox: "w-9 h-9 rounded-xl border border-slate-700 shadow-md transition-transform hover:scale-105"
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

            {/* Floating Scroll-to-Top Button */}
            <button
                onClick={scrollToTop}
                className={`fixed bottom-6 right-6 p-4 bg-brand-500/10 hover:bg-brand-500 backdrop-blur-md text-brand-400 hover:text-white rounded-2xl border border-brand-500/20 shadow-2xl transition-all duration-500 transform z-[100] group
                ${showScrollTop ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-50 pointer-events-none'}`}
                title="Voltar ao topo"
            >
                <ChevronUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
            </button>
        </>
    );
}
