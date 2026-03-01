"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Users, UserPlus, ShieldCheck, Mail, Loader2, PlayCircle, StopCircle, UserX, ShieldAlert, Link as LinkIcon, Save, Send, CheckCircle2 } from "lucide-react";

export default function AdminPage() {
    const [email, setEmail] = useState("");
    const [allowedUsers, setAllowedUsers] = useState<any[]>([]);
    const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [globalSettings, setGlobalSettings] = useState({
        webhookUrl: '',
        scanInterval: 15,
        customMessage: '',
        workStart: '10:00',
        workEnd: '19:00',
        masterSwitch: true
    });
    const [savingSettings, setSavingSettings] = useState(false);
    const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [testOneSignalStatus, setTestOneSignalStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [oneSignalResult, setOneSignalResult] = useState<any>(null);
    const [oneSignalDiag, setOneSignalDiag] = useState<any>(null);

    const fetchUsersAndSettings = async () => {
        const [resUsers, resSettings] = await Promise.all([
            fetch("/api/admin/allowed-users"),
            fetch("/api/admin/global-settings")
        ]);
        const data = await resUsers.json();
        const settingsData = await resSettings.json();

        setAllowedUsers(data.allowed || []);
        setRegisteredUsers(data.registeredUsers || []);
        if (!settingsData.error) {
            setGlobalSettings({
                webhookUrl: settingsData.webhookUrl || '',
                scanInterval: settingsData.scanInterval || 15,
                workStart: settingsData.workStart || '10:00',
                workEnd: settingsData.workEnd || '19:00',
                masterSwitch: settingsData.masterSwitch ?? true,
                customMessage: settingsData.customMessage || "🕘 *BOLETIM DE MERCADO* 🕘\n\n📊 *PANORAMA GERAL:*\n{{panorama}}\n\n📈 *TENDÊNCIAS QUENTES:*\n{{trends}}\n\n💼 *DESTAQUES CARTEIRA:*\n{{highlights}}\n\n🚨 *SINAIS/ALERTAS:*\n{{alerts}}\n\n💡 *DICAS DO SCANNER:*\n{{suggestions}}\n\n⚠️ *ATENÇÃO:* Evite entradas pesadas sem confirmação.",
            });
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUsersAndSettings();
        // Auto-diagnose OneSignal on page load
        fetch("/api/admin/test-onesignal")
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d) setOneSignalDiag(d); })
            .catch(() => { });
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        await fetch("/api/admin/allowed-users", {
            method: "POST",
            body: JSON.stringify({ email }),
        });
        setEmail("");
        await fetchUsersAndSettings();
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
        await fetchUsersAndSettings();
        setActionLoading(false);
    };

    const removePreAllowed = async (id: number, userEmail: string) => {
        if (!confirm(`Remover pré-autorização de ${userEmail}?`)) return;
        setActionLoading(true);
        await fetch(`/api/admin/allowed-users?id=${id}`, { method: "DELETE" });
        await fetchUsersAndSettings();
        setActionLoading(false);
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingSettings(true);
        try {
            await fetch("/api/admin/global-settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(globalSettings),
            });
            alert("Configurações Globais Atualizadas!");
        } catch {
            alert("Erro ao salvar.");
        } finally {
            setSavingSettings(false);
        }
    };

    const handleTestWebhook = async () => {
        setTestStatus('loading');
        try {
            const res = await fetch("/api/webhook/test", { method: "POST" });
            const data = await res.json();
            if (data.success) {
                setTestStatus('success');
            } else {
                setTestStatus('error');
                alert("Erro: " + (data.error || "Desconhecido"));
            }
        } catch {
            setTestStatus('error');
        }
    };

    const handleTestOneSignal = async () => {
        setTestOneSignalStatus('loading');
        setOneSignalResult(null);
        try {
            const res = await fetch("/api/admin/test-onesignal", { method: "POST" });
            const data = await res.json();
            setOneSignalResult(data);
            setTestOneSignalStatus(data.success ? 'success' : 'error');
        } catch (err: any) {
            setOneSignalResult({ error: err.message });
            setTestOneSignalStatus('error');
        }
    };

    // Pre-calculate derived state
    const allowedEmailsSet = new Set(allowedUsers.map((u) => u.email.toLowerCase()));

    // Filtro para achar quem foi liberado, mas ainda não se registrou
    const registeredEmailsSet = new Set(registeredUsers.map((u) => u.email.toLowerCase()));
    const preAllowedOnly = allowedUsers.filter((u) => !registeredEmailsSet.has(u.email.toLowerCase()));

    return (
        <div className="flex flex-col min-h-screen bg-slate-950">
            <Navbar />

            <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 lg:py-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
                    <div className="p-3 bg-brand-500/10 rounded-2xl border border-brand-500/20 shadow-inner">
                        <Users className="w-8 h-8 text-brand-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Gerenciamento de Usuários</h1>
                        <p className="text-slate-400 font-medium">Controle de acessos ao dashboard e liberação de novas contas.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8">
                    {/* Top Section: Registered Users List */}
                    <div className="lg:col-span-2 glass p-5 sm:p-8 lg:p-10 rounded-2xl lg:rounded-[32px] border border-white/5 shadow-2xl flex flex-col h-fit relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 to-indigo-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight">Usuários Cadastrados</h2>
                            <span className="px-3 py-1.5 bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-bold rounded-full shadow-inner">
                                {registeredUsers.length} usuários
                            </span>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-12 items-center">
                                <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {registeredUsers.length === 0 && (
                                    <p className="text-slate-500 italic text-center py-12">Nenhum usuário acessou o sistema ainda.</p>
                                )}
                                {registeredUsers.map((user) => {
                                    const isAllowed = allowedEmailsSet.has(user.email.toLowerCase()) || user.isAdmin;
                                    const isAdmin = user.isAdmin;

                                    return (
                                        <div key={user.id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-slate-900 border ${isAllowed ? 'border-brand-500/20 bg-brand-500/5' : 'border-slate-800'} rounded-2xl transition-all`}>
                                            <div className="flex flex-col gap-2">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <span className="text-slate-200 font-bold text-base sm:text-lg max-w-full truncate">
                                                        {user.email}
                                                    </span>
                                                    {isAdmin && (
                                                        <span className="px-2.5 py-1 bg-brand-500 text-white text-[10px] uppercase font-black tracking-wider rounded-md">Admin</span>
                                                    )}
                                                    {!isAdmin && isAllowed && (
                                                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] uppercase font-black tracking-wider rounded-md border border-emerald-500/20">Acesso Liberado</span>
                                                    )}
                                                    {!isAdmin && !isAllowed && (
                                                        <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 text-[10px] uppercase font-black tracking-wider rounded-md border border-rose-500/20">Bloqueado</span>
                                                    )}
                                                </div>
                                                <span className="text-sm text-slate-500 font-medium ml-1">
                                                    Registrado em: {new Date(user.createdAt).toLocaleDateString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                                </span>
                                            </div>

                                            {!isAdmin && (
                                                <button
                                                    onClick={() => handleToggleAccess(user.email, isAllowed)}
                                                    disabled={actionLoading}
                                                    className={`w-full sm:w-auto px-5 py-2.5 flex justify-center items-center gap-2 rounded-xl font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 ${isAllowed
                                                        ? "bg-slate-800 hover:bg-rose-500/10 hover:text-rose-500 text-slate-300 focus:ring-rose-500"
                                                        : "bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/20 focus:ring-brand-500"
                                                        }`}
                                                >
                                                    {isAllowed ? (
                                                        <>
                                                            <StopCircle className="w-4 h-4" />
                                                            <span>Revogar Acesso</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <PlayCircle className="w-4 h-4" />
                                                            <span>Liberar Acesso</span>
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">

                    {/* Left Column: Form & Pre-Allowed List */}
                    <div className="lg:col-span-1 space-y-6 sm:space-y-8">
                        {/* Form Section */}
                        <div className="glass p-5 sm:p-8 rounded-2xl lg:rounded-[32px] border border-white/5 shadow-2xl h-fit relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 to-transparent pointer-events-none"></div>
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 relative z-10 tracking-tight">
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
                        <div className="glass p-5 sm:p-6 rounded-2xl lg:rounded-[32px] border border-white/5 shadow-2xl flex flex-col relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/5 to-transparent pointer-events-none"></div>
                            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2 relative z-10 tracking-tight">
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

                    {/* Middle Column: Global Settings */}
                    <div className="lg:col-span-1 space-y-6 sm:space-y-8">
                        <div className="glass p-5 sm:p-8 rounded-2xl lg:rounded-[32px] border border-white/5 shadow-2xl h-fit relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none"></div>
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 relative z-10 tracking-tight">
                                <LinkIcon className="w-5 h-5 text-brand-400" />
                                Webhook Central
                            </h2>
                            <p className="text-sm text-slate-400 mb-6">Configurações globais que valem para o disparo do sistema todo e o timer.</p>

                            <form onSubmit={handleSaveSettings} className="space-y-4">
                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">
                                        URL do Webhook Master
                                    </label>
                                    <input
                                        type="url"
                                        required
                                        value={globalSettings.webhookUrl}
                                        onChange={(e) => setGlobalSettings({ ...globalSettings, webhookUrl: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">
                                        Scan Loop (Minutos)
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={globalSettings.scanInterval}
                                        onChange={(e) => setGlobalSettings({ ...globalSettings, scanInterval: parseInt(e.target.value) || 15 })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm"
                                    />
                                </div>

                                <div className="p-4 bg-slate-900 border border-slate-700/50 rounded-2xl flex items-center justify-between mt-4">
                                    <div>
                                        <label className="text-sm font-bold text-white block">Motor Principal (Master Switch)</label>
                                        <p className="text-[11px] text-slate-400 mt-1">Habilita ou desabilita totalmente o scan e envios do sistema.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setGlobalSettings({ ...globalSettings, masterSwitch: !globalSettings.masterSwitch })}
                                        className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${globalSettings.masterSwitch ? 'bg-emerald-500' : 'bg-slate-700'}`}
                                    >
                                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition duration-200 ease-in-out ${globalSettings.masterSwitch ? 'translate-x-8 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">
                                            Hora de Início
                                        </label>
                                        <input
                                            type="time"
                                            required
                                            value={globalSettings.workStart}
                                            onChange={(e) => setGlobalSettings({ ...globalSettings, workStart: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">
                                            Hora de Fim
                                        </label>
                                        <input
                                            type="time"
                                            required
                                            value={globalSettings.workEnd}
                                            onChange={(e) => setGlobalSettings({ ...globalSettings, workEnd: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-700/50 mt-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">
                                            Mensagem de Alerta (Template)
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setGlobalSettings({ ...globalSettings, customMessage: "🕘 *BOLETIM DE MERCADO* 🕘\n\n📊 *PANORAMA GERAL:*\n{{panorama}}\n\n📈 *TENDÊNCIAS QUENTES:*\n{{trends}}\n\n💼 *DESTAQUES CARTEIRA:*\n{{highlights}}\n\n🚨 *SINAIS/ALERTAS:*\n{{alerts}}\n\n💡 *DICAS DO SCANNER:*\n{{suggestions}}\n\n⚠️ *ATENÇÃO:* Evite entradas pesadas sem confirmação." })}
                                            className="text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-lg transition-all uppercase tracking-tight shadow-sm active:scale-95"
                                        >
                                            Restaurar Padrão
                                        </button>
                                    </div>
                                    <textarea
                                        rows={12}
                                        required
                                        value={globalSettings.customMessage}
                                        onChange={(e) => setGlobalSettings({ ...globalSettings, customMessage: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 px-5 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-xs font-mono shadow-inner mb-2"
                                    />
                                    <p className="text-[11px] text-slate-500 italic leading-relaxed">
                                        Use as variáveis {'{{alerts}}'}, {'{{suggestions}}'}, {'{{panorama}}'}, {'{{trends}}'} e {'{{highlights}}'} onde desejar que o conteúdo flua automaticamente no webhook.
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={savingSettings}
                                    className="w-full mt-2 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                >
                                    {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Salvar Configs
                                </button>
                            </form>
                        </div>

                        <div className="glass p-5 sm:p-6 rounded-2xl lg:rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 to-transparent pointer-events-none"></div>
                            <h3 className="text-lg font-bold text-white mb-2 relative z-10 tracking-tight">Disparo WhatsApp</h3>
                            <p className="text-sm text-slate-400 mb-4 relative z-10">Envie uma notificação teste para o seu WhatsApp configurado via webhook.</p>
                            <button
                                onClick={handleTestWebhook}
                                disabled={testStatus === 'loading'}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                            >
                                {testStatus === 'loading' ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : testStatus === 'success' ? (
                                    <><CheckCircle2 className="w-4 h-4" /> Sucesso!</>
                                ) : (
                                    <><Send className="w-4 h-4" /> Disparar Agora</>
                                )}
                            </button>
                        </div>

                        <div className="glass p-5 sm:p-6 rounded-2xl lg:rounded-[32px] border border-white/5 shadow-2xl mt-6 sm:mt-8 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 to-transparent pointer-events-none"></div>
                            <h3 className="text-lg font-bold text-white mb-2 relative z-10 tracking-tight">Testar OneSignal (Push)</h3>
                            <p className="text-sm text-slate-400 mb-4 relative z-10">Envie uma notificação push teste para o navegador ou celular.</p>

                            {/* Diagnostic Info */}
                            {oneSignalDiag && (
                                <div className={`mb-4 p-4 rounded-xl border text-xs space-y-1 ${oneSignalDiag.appIdConfigured && oneSignalDiag.restApiKeyConfigured
                                    ? 'bg-emerald-500/10 border-emerald-500/30'
                                    : 'bg-red-500/10 border-red-500/30'
                                    }`}>
                                    <p className="font-bold text-white text-sm mb-2">🔍 Diagnóstico (Env Vars na Vercel):</p>
                                    <p className={oneSignalDiag.appIdConfigured ? 'text-emerald-400' : 'text-red-400'}>
                                        {oneSignalDiag.appIdConfigured ? '✅' : '❌'} NEXT_PUBLIC_ONESIGNAL_APP_ID: {oneSignalDiag.appIdConfigured ? oneSignalDiag.appIdPreview : 'NÃO CONFIGURADA'}
                                    </p>
                                    <p className={oneSignalDiag.restApiKeyConfigured ? 'text-emerald-400' : 'text-red-400'}>
                                        {oneSignalDiag.restApiKeyConfigured ? '✅' : '❌'} ONESIGNAL_REST_API_KEY: {oneSignalDiag.restApiKeyConfigured ? oneSignalDiag.restApiKeyPreview : 'NÃO CONFIGURADA'}
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={handleTestOneSignal}
                                disabled={testOneSignalStatus === 'loading'}
                                className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20"
                            >
                                {testOneSignalStatus === 'loading' ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : testOneSignalStatus === 'success' ? (
                                    <><CheckCircle2 className="w-4 h-4" /> Notificação Enviada!</>
                                ) : (
                                    <><Send className="w-4 h-4" /> Disparar Push</>
                                )}
                            </button>

                            {/* Test Result Details */}
                            {oneSignalResult && (
                                <div className={`mt-4 p-4 rounded-xl border text-xs font-mono ${oneSignalResult.success
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                                    }`}>
                                    <p className="font-bold text-sm mb-2 font-sans">
                                        {oneSignalResult.success ? '✅ Sucesso!' : '❌ Falha no Envio'}
                                    </p>
                                    {oneSignalResult.notificationId && (
                                        <p>📌 Notification ID: {oneSignalResult.notificationId}</p>
                                    )}
                                    {oneSignalResult.recipients !== null && oneSignalResult.recipients !== undefined && (
                                        <p>👥 Recipients: {oneSignalResult.recipients}</p>
                                    )}
                                    {oneSignalResult.error && (
                                        <p className="text-red-400">⚠️ Erro: {oneSignalResult.error}</p>
                                    )}
                                    {oneSignalResult.rawResponse && (
                                        <details className="mt-2">
                                            <summary className="cursor-pointer text-slate-400 hover:text-white transition-colors font-sans text-sm">Ver resposta completa</summary>
                                            <pre className="mt-2 whitespace-pre-wrap text-[10px] text-slate-400 overflow-auto max-h-40">{JSON.stringify(oneSignalResult.rawResponse, null, 2)}</pre>
                                        </details>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>


                </div>
            </div>
        </div>
    );
}
