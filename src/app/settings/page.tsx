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

    const handleSendLastBulletin = async () => {
        setSendingLast(true);
        try {
            const res = await fetch("/api/webhook/test?forceLastBulletin=true", { method: "POST" });
            const data = await res.json();
            if (data.success) {
                alert("Último relatório oficial enviado com sucesso!");
            } else {
                alert("Erro ao enviar: " + (data.error || "Desconhecido"));
            }
        } catch {
            alert("Erro na conexão.");
        } finally {
            setSendingLast(false);
        }
    };

    const handleLoadLastBulletin = () => {
        if (lastAlertFullContent) {
            setForm({ ...form, customMessage: lastAlertFullContent });
        }
    };

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
        <div className="flex flex-col min-h-screen">
            <Navbar />

            <div className="flex-1 w-full max-w-3xl mx-auto space-y-8 mt-4">
                <div className="glass p-8 sm:p-12 rounded-3xl border border-slate-700/50 shadow-2xl relative overflow-hidden">

                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-[80px]" />

                    <h2 className="text-3xl font-extrabold text-white mb-2 relative z-10 flex items-center gap-3">
                        <span className="p-3 bg-slate-800 rounded-2xl border border-slate-700 shadow-inner">
                            <LinkIcon className="w-6 h-6 text-brand-400" />
                        </span>
                        Configurações de Alertas
                    </h2>
                    <p className="text-slate-400 mb-8 relative z-10 text-lg">Personalize como e quando você recebe os boletins da sua carteira.</p>

                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        <div className="space-y-3 pt-2">
                            <label className="text-sm font-semibold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                <Phone className="w-4 h-4 text-brand-500" />
                                Número de Telefone (Destino)
                            </label>
                            <input
                                type="text"
                                placeholder="5511999999999"
                                value={form.phoneNumber}
                                onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-mono shadow-inner text-lg"
                            />
                            <p className="text-xs text-slate-500 italic">Será enviado dentro do JSON payload para o webhook no formato: {`{ phone, msg }`}</p>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-slate-700/50">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-semibold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                    Mensagem de Alerta (Template)
                                </label>
                                {lastAlertFullContent && (
                                    <button
                                        type="button"
                                        onClick={handleSendLastBulletin}
                                        disabled={sendingLast}
                                        className="text-[10px] font-bold bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 px-3 py-1 rounded-lg border border-brand-500/30 transition-all uppercase tracking-tight flex items-center gap-2 shadow-sm active:scale-95 disabled:opacity-50"
                                    >
                                        {sendingLast ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                        Enviar último relatório agora
                                    </button>
                                )}
                            </div>
                            <textarea
                                rows={8}
                                value={form.customMessage}
                                onChange={e => setForm({ ...form, customMessage: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-mono shadow-inner text-sm"
                            />
                            <p className="text-xs text-slate-500 italic block mt-1">
                                Use as variáveis {'{{alerts}}'}, {'{{suggestions}}'}, {'{{panorama}}'}, {'{{trends}}'} e {'{{highlights}}'} onde desejar que o conteúdo flua.
                            </p>
                        </div>



                        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-700/50">
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                    Horário Início
                                </label>
                                <input
                                    type="time"
                                    value={form.workStart}
                                    onChange={e => setForm({ ...form, workStart: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-mono shadow-inner text-lg"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                    Horário Fim
                                </label>
                                <input
                                    type="time"
                                    value={form.workEnd}
                                    onChange={e => setForm({ ...form, workEnd: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-mono shadow-inner text-lg"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 italic block mt-1">Neste período, o sistema envia o 1º boletim ao conectar, e de hora em hora caso não passe por nenhuma alteração.</p>

                        <div className="flex items-center gap-4 py-4 bg-slate-900/50 p-5 rounded-2xl border border-slate-800">
                            <input
                                type="checkbox"
                                id="auto"
                                checked={form.autoAlerts}
                                onChange={e => setForm({ ...form, autoAlerts: e.target.checked })}
                                className="w-6 h-6 rounded border-slate-700 text-brand-600 focus:ring-brand-500 bg-slate-800"
                            />
                            <div>
                                <label htmlFor="auto" className="text-white font-bold text-lg cursor-pointer">Auto Alertas</label>
                                <p className="text-sm text-slate-400">Permitir envio automático ao analisar carteira quando houver sinais fortes de setup.</p>
                            </div>
                        </div>

                        <div className="pt-6 flex flex-col sm:flex-row gap-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-brand-500/25 active:scale-95 text-lg"
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
