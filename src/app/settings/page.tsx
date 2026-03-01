"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { Link as LinkIcon, Phone, Save, Loader2, Send, CheckCircle2 } from "lucide-react";

export default function Settings() {
    const [form, setForm] = useState({ phoneNumber: '', autoAlerts: true, customMessage: '', workStart: '10:00', workEnd: '19:00' });
    const [lastAlertFullContent, setLastAlertFullContent] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sendingLast, setSendingLast] = useState(false);

    useEffect(() => {
        fetch("/api/settings")
            .then(res => res.json())
            .then(data => {
                if (!data.error) {
                    setForm({
                        phoneNumber: data.phoneNumber || '',
                        autoAlerts: data.autoAlerts ?? true,
                        customMessage: data.customMessage || "🕘 *BOLETIM DE MERCADO* 🕘\n\n📊 *PANORAMA GERAL:*\n{{panorama}}\n\n📈 *TENDÊNCIAS QUENTES:*\n{{trends}}\n\n💼 *DESTAQUES CARTEIRA:*\n{{highlights}}\n\n🚨 *SINAIS/ALERTAS:*\n{{alerts}}\n\n💡 *DICAS DO SCANNER:*\n{{suggestions}}\n\n⚠️ *ATENÇÃO:* Evite entradas pesadas sem confirmação.",
                        workStart: data.workStart || '10:00',
                        workEnd: data.workEnd || '19:00'
                    });
                    setLastAlertFullContent(data.lastAlertFullContent || null);
                    if (data.isAdmin) setIsAdmin(true);
                }
                setLoading(false);
            });
    }, []);



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            alert("Configurações salvas com sucesso!");
        } catch {
            alert("Erro ao salvar.");
        } finally {
            setSaving(false);
        }
    };



    if (loading) return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <div className="flex-1 flex justify-center items-center"><Loader2 className="w-12 h-12 text-brand-500 animate-spin" /></div>
        </div>
    );

    return (
        <div className="flex flex-col min-h-[80vh] bg-transparent pb-16">
            <Navbar />

            <div className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 space-y-8 mt-4">
                <div className="glass p-5 sm:p-8 lg:p-12 rounded-2xl sm:rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden">

                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-[80px] pointer-events-none" />

                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 relative z-10 flex items-center gap-3 tracking-tight">
                        <span className="p-2 sm:p-3 bg-slate-900 border border-white/10 rounded-xl sm:rounded-2xl shadow-inner">
                            <LinkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-brand-400" />
                        </span>
                        Configurações de Alertas
                    </h2>
                    <p className="text-slate-400 mb-6 sm:mb-8 relative z-10 text-sm sm:text-lg">Personalize como e quando você recebe os boletins da sua carteira.</p>

                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        <div className="space-y-2 sm:space-y-3 pt-2">
                            <label className="text-xs sm:text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Phone className="w-4 h-4 text-brand-500" />
                                Número de Telefone (Destino)
                            </label>
                            <input
                                type="text"
                                placeholder="5511999999999"
                                value={form.phoneNumber}
                                onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-mono shadow-sm text-base sm:text-lg"
                            />
                            <p className="text-[10px] sm:text-xs text-slate-500 italic">Será enviado dentro do JSON para o webhook: {`{ phone, msg }`}</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-4 border-t border-white/5">
                            <div className="space-y-2 sm:space-y-3">
                                <label className="text-xs sm:text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    Horário Início
                                </label>
                                <input
                                    type="time"
                                    value={form.workStart}
                                    onChange={e => setForm({ ...form, workStart: e.target.value })}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-mono shadow-sm text-base sm:text-lg"
                                />
                            </div>
                            <div className="space-y-2 sm:space-y-3">
                                <label className="text-xs sm:text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    Horário Fim
                                </label>
                                <input
                                    type="time"
                                    value={form.workEnd}
                                    onChange={e => setForm({ ...form, workEnd: e.target.value })}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-mono shadow-sm text-base sm:text-lg"
                                />
                            </div>
                        </div>
                        <p className="text-[10px] sm:text-xs text-slate-500 italic block mt-1">Neste período, o sistema envia o 1º boletim ao conectar, e de hora em hora caso não passe por nenhuma alteração.</p>

                        <div className="flex items-start sm:items-center gap-3 sm:gap-4 py-3 sm:py-4 bg-slate-900/40 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-white/5 shadow-sm mt-4">
                            <input
                                type="checkbox"
                                id="auto"
                                checked={form.autoAlerts}
                                onChange={e => setForm({ ...form, autoAlerts: e.target.checked })}
                                className="w-5 h-5 sm:w-6 sm:h-6 mt-1 sm:mt-0 rounded border-slate-700 text-brand-600 focus:ring-brand-500 bg-slate-800 shrink-0"
                            />
                            <div>
                                <label htmlFor="auto" className="text-white font-bold text-base sm:text-lg cursor-pointer block select-none">Auto Alertas</label>
                                <p className="text-xs sm:text-sm text-slate-400 leading-snug">Permitir envio automático quando houver sinais fortes na análise da carteira.</p>
                            </div>
                        </div>

                        <div className="pt-4 sm:pt-6">
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3.5 sm:py-4 rounded-xl sm:rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-brand-500/25 active:scale-95 text-base sm:text-lg"
                            >
                                {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-6 h-6" /> Salvar Configurações</>}
                            </button>
                        </div>
                    </form>

                </div>
            </div>
        </div>
    );
}
