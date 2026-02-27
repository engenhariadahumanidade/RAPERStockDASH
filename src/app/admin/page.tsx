"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Users, UserPlus, Trash2, ShieldCheck, Mail, Loader2 } from "lucide-react";

export default function AdminPage() {
    const [email, setEmail] = useState("");
    const [allowedUsers, setAllowedUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        const res = await fetch("/api/admin/allowed-users");
        const data = await res.json();
        setAllowedUsers(data);
        setLoading(false);
    };

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

    const handleDelete = async (id: number) => {
        if (!confirm("Remover acesso deste e-mail?")) return;
        setActionLoading(true);
        await fetch(`/api/admin/allowed-users?id=${id}`, { method: "DELETE" });
        await fetchUsers();
        setActionLoading(false);
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />

            <div className="max-w-4xl mx-auto w-full px-4">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-brand-500/10 rounded-2xl border border-brand-500/20">
                        <Users className="w-8 h-8 text-brand-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Painel Administrativo</h1>
                        <p className="text-slate-400 font-medium">Controle quem pode acessar o terminal RAPERStock.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Form Section */}
                    <div className="glass p-8 rounded-[32px] border border-slate-700/50 shadow-2xl h-fit">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-emerald-400" />
                            Liberar Novo Acesso
                        </h2>

                        <form onSubmit={handleAdd} className="space-y-4">
                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">
                                    E-mail do Usuário
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
                                Autorizar Acesso
                            </button>
                        </form>
                    </div>

                    {/* List Section */}
                    <div className="glass p-8 rounded-[32px] border border-slate-700/50 shadow-2xl overflow-hidden flex flex-col">
                        <h2 className="text-xl font-bold text-white mb-6">Usuários Autorizados</h2>

                        {loading ? (
                            <div className="flex justify-center p-12">
                                <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
                            </div>
                        ) : (
                            <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                                {allowedUsers.length === 0 && (
                                    <p className="text-slate-500 italic text-center py-8">Nenhum usuário cadastrado.</p>
                                )}
                                {allowedUsers.map((user) => (
                                    <div key={user.id} className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-2xl group transition-all hover:border-slate-700">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                            <span className="text-slate-200 font-medium truncate max-w-[180px]">{user.email}</span>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
