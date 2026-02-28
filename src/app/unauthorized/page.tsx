"use client";

import Navbar from "@/components/Navbar";
import { ShieldAlert, LogIn } from "lucide-react";
import { useClerk } from "@clerk/nextjs";

export default function UnauthorizedPage() {
    const { signOut } = useClerk();

    const handleSwitchAccount = async () => {
        await signOut();
        // After sign out, the user will be redirected to the root or the sign-in page 
        // depending on the clerk configuration. Usually, it's better to force a reload or 
        // let Clerk's middleware handle the redirect since we are now at /unauthorized 
        // which might be protected or not.
        window.location.href = "/";
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <div className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="glass p-12 rounded-[32px] border border-slate-700/50 shadow-2xl flex flex-col items-center text-center max-w-lg relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-50" />

                    <div className="w-20 h-20 bg-rose-500/10 rounded-2xl border border-rose-500/20 flex items-center justify-center mb-6">
                        <ShieldAlert className="w-10 h-10 text-rose-500" />
                    </div>

                    <h1 className="text-3xl font-black text-white mb-4 tracking-tight">Acesso Restrito</h1>

                    <p className="text-slate-400 mb-8 leading-relaxed">
                        Sua conta não possui permissão para acessar este terminal.
                        Entre em contato com o administrador para solicitar a liberação do seu e-mail.
                    </p>

                    <button
                        onClick={handleSwitchAccount}
                        className="flex items-center gap-2 px-8 py-4 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-black transition-all shadow-xl shadow-brand-500/20 active:scale-95"
                    >
                        <LogIn className="w-5 h-5" />
                        Tentar com outra conta
                    </button>
                </div>
            </div>
        </div>
    );
}
