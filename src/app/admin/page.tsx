"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Users, UserPlus, ShieldCheck, Mail, Loader2, PlayCircle, StopCircle, UserX, ShieldAlert } from "lucide-react";

export default function AdminPage() {
    const [email, setEmail] = useState("");
    const [allowedUsers, setAllowedUsers] = useState<any[]>([]);
    const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchUsers = async () => {
        const res = await fetch("/api/admin/allowed-users");
        const data = await res.json();
        setAllowedUsers(data.allowed || []);
        setRegisteredUsers(data.registeredUsers || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        await fetch("/api/admin/allowed-users", {
            method: "POST",
            body: JSON.stringify({ email }),
        });
        setEmail("");
        await fetchUsers();
        setActionLoading(false);
    };

    const handleToggleAccess = async (userEmail: string, isAllowed: boolean) => {
        setActionLoading(true);
        if (isAllowed) {
            // Revoke access
            if (!confirm(`Revocar o acesso de ${userEmail}?`)) {
                setActionLoading(false);
                return;
            }
            await fetch(`/api/admin/allowed-users?email=${encodeURIComponent(userEmail)}`, { method: "DELETE" });
        } else {
            // Grant access
            if (!confirm(`Liberar acesso para ${userEmail}?`)) {
                setActionLoading(false);
                return;
            }
            await fetch("/api/admin/allowed-users", {
                method: "POST",
                body: JSON.stringify({ email: userEmail }),
            });
        }
        await fetchUsers();
        setActionLoading(false);
    };

    const removePreAllowed = async (id: number, userEmail: string) => {
        if (!confirm(`Remover pré-autorização de ${userEmail}?`)) return;
        setActionLoading(true);
        await fetch(`/api/admin/allowed-users?id=${id}`, { method: "DELETE" });
        await fetchUsers();
        setActionLoading(false);
    };

    // Pre-calculate derived state
    const allowedEmailsSet = new Set(allowedUsers.map((u) => u.email.toLowerCase()));

    // Filtro para achar quem foi liberado, mas ainda não se registrou
    const registeredEmailsSet = new Set(registeredUsers.map((u) => u.email.toLowerCase()));
    const preAllowedOnly = allowedUsers.filter((u) => !registeredEmailsSet.has(u.email.toLowerCase()));

    return (
        <div className="flex flex-col min-h-screen bg-slate-950">
            <Navbar />

            <div className="max-w-6xl mx-auto w-full px-4 py-8">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-brand-500/10 rounded-2xl border border-brand-500/20">
                        <Users className="w-8 h-8 text-brand-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Gerenciamento de Usuários</h1>
                        <p className="text-slate-400 font-medium">Controle de acessos ao dashboard e liberação de novas contas.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Form & Pre-Allowed List */}
                    <div className="lg:col-span-1 space-y-8">
                        {/* Form Section */}
                        <div className="glass p-8 rounded-[32px] border border-slate-700/50 shadow-2xl h-fit">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-brand-400" />
                                Convite Rápido
                            </h2>

                            <form onSubmit={handleAdd} className="space-y-4">
                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">
                                        E-mail para Liberar
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="exemplo@email.com"
                                            className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="w-full py-4 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-2xl font-black transition-all shadow-xl shadow-brand-500/20 flex items-center justify-center gap-2 active:scale-95"
                                >
                                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                                    Liberar Acesso
                                </button>
                            </form>
                        </div>

                        {/* Pre-allowed users (Not registered yet) */}
                        <div className="glass p-6 rounded-[32px] border border-slate-700/50 shadow-2xl flex flex-col">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <ShieldAlert className="w-5 h-5 text-yellow-500" />
                                Pendentes de Cadastro
                            </h3>
                            <p className="text-sm text-slate-400 mb-4">E-mails liberados, mas que ainda não criaram conta ou acessaram o sistema.</p>

                            {loading ? (
                                <div className="flex justify-center p-6"><Loader2 className="w-6 h-6 text-brand-500 animate-spin" /></div>
                            ) : preAllowedOnly.length === 0 ? (
                                <div className="text-slate-500 text-sm italic py-4 text-center">Nenhum e-mail pendente.</div>
                            ) : (
                                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                    {preAllowedOnly.map((u) => (
                                        <div key={u.id} className="flex flex-col gap-2 p-3 bg-slate-900/50 border border-slate-800 rounded-xl group transition-all hover:border-slate-700">
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-200 text-sm font-medium truncate">{u.email}</span>
                                                <button
                                                    onClick={() => removePreAllowed(u.id, u.email)}
                                                    className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                                    title="Remover Permissão"
                                                >
                                                    <UserX className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Registered Users List */}
                    <div className="lg:col-span-2 glass p-8 rounded-[32px] border border-slate-700/50 shadow-2xl flex flex-col h-full min-h-[500px]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Usuários Cadastrados</h2>
                            <span className="px-3 py-1 bg-slate-800 text-slate-300 text-xs font-bold rounded-full">
                                {registeredUsers.length} usuários
                            </span>
                        </div>

                        {loading ? (
                            <div className="flex justify-center flex-1 items-center">
                                <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
                            </div>
                        ) : (
                            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                                {registeredUsers.length === 0 && (
                                    <p className="text-slate-500 italic text-center py-12">Nenhum usuário acessou o sistema ainda.</p>
                                )}
                                {registeredUsers.map((user) => {
                                    const isAllowed = allowedEmailsSet.has(user.email.toLowerCase()) || user.isAdmin;
                                    const isAdmin = user.isAdmin;

                                    return (
                                        <div key={user.id} className={`flex items-center justify-between p-4 bg-slate-900 border ${isAllowed ? 'border-brand-500/20 bg-brand-500/5' : 'border-slate-800'} rounded-2xl transition-all`}>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-slate-200 font-bold max-w-[200px] sm:max-w-full truncate">
                                                        {user.email}
                                                    </span>
                                                    {isAdmin && (
                                                        <span className="px-2 py-0.5 bg-brand-500 text-white text-[10px] uppercase font-black tracking-wider rounded">Admin</span>
                                                    )}
                                                    {!isAdmin && isAllowed && (
                                                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] uppercase font-black tracking-wider rounded border border-emerald-500/20">Acesso Liberado</span>
                                                    )}
                                                    {!isAdmin && !isAllowed && (
                                                        <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 text-[10px] uppercase font-black tracking-wider rounded border border-rose-500/20">Bloqueado</span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-slate-500 font-medium ml-1">
                                                    Registrado em: {new Date(user.createdAt).toLocaleDateString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                                </span>
                                            </div>

                                            {!isAdmin && (
                                                <button
                                                    onClick={() => handleToggleAccess(user.email, isAllowed)}
                                                    disabled={actionLoading}
                                                    className={`px-4 py-2 flex items-center gap-2 rounded-xl font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 ${isAllowed
                                                            ? "bg-slate-800 hover:bg-rose-500/10 hover:text-rose-500 text-slate-300 focus:ring-rose-500"
                                                            : "bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/20 focus:ring-brand-500"
                                                        }`}
                                                >
                                                    {isAllowed ? (
                                                        <>
                                                            <StopCircle className="w-4 h-4" />
                                                            <span className="hidden sm:inline">Revogar</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <PlayCircle className="w-4 h-4" />
                                                            <span className="hidden sm:inline">Liberar Acesso</span>
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
