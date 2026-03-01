"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { Plus, Trash2, Edit2, Loader2, Save, X } from "lucide-react";

export default function ManagePortfolio() {
    const [stocks, setStocks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ symbol: '', quantity: '', averagePrice: '' });
    const [editingId, setEditingId] = useState<number | null>(null);

    useEffect(() => {
        fetchStocks();
    }, []);

    const fetchStocks = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/stocks");
            const data = await res.json();
            setStocks(Array.isArray(data) ? data : []);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.symbol || !form.quantity || !form.averagePrice) return;

        try {
            const method = editingId ? "PUT" : "POST";
            const url = editingId ? `/api/stocks/${editingId}` : "/api/stocks";

            await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            setForm({ symbol: '', quantity: '', averagePrice: '' });
            setEditingId(null);
            fetchStocks();
        } catch (error) {
            console.error("Failed to save stock", error);
        }
    };

    const handleEdit = (stock: any) => {
        setEditingId(stock.id);
        setForm({ symbol: stock.symbol, quantity: stock.quantity.toString(), averagePrice: stock.averagePrice.toString() });
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Deseja realmente remover esta ação?")) return;
        try {
            await fetch(`/api/stocks/${id}`, { method: "DELETE" });
            fetchStocks();
        } catch (error) {
            console.error("Failed to delete stock", error);
        }
    };

    return (
        <div className="flex flex-col min-h-[80vh] bg-transparent pb-16">
            <Navbar />

            <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 space-y-8 mt-4">
                <div className="glass p-5 sm:p-8 rounded-2xl sm:rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent pointer-events-none opacity-50 z-0"></div>
                    <div className="relative z-10 w-full">
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-6 flex items-center gap-3 tracking-tight">
                            <span className="bg-brand-500/20 text-brand-400 p-2 rounded-xl border border-brand-500/10 shadow-inner"><Plus className="w-5 h-5 sm:w-6 sm:h-6" /></span>
                            {editingId ? "Editar Ação" : "Adicionar Nova Ação"}
                        </h2>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 items-end">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Ativo</label>
                                <input
                                    type="text"
                                    placeholder="Ex: PETR4.SA"
                                    value={form.symbol}
                                    onChange={e => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 sm:py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-mono uppercase text-sm sm:text-base shadow-sm"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Qtd</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0"
                                    value={form.quantity}
                                    onChange={e => setForm({ ...form, quantity: e.target.value })}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 sm:py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-sm sm:text-base shadow-sm"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Preço Médio</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="R$ 0.00"
                                    value={form.averagePrice}
                                    onChange={e => setForm({ ...form, averagePrice: e.target.value })}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 sm:py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-sm sm:text-base shadow-sm"
                                    required
                                />
                            </div>
                            <div className="flex gap-2 h-auto sm:h-[50px] mt-2 sm:mt-0">
                                <button
                                    type="submit"
                                    className="flex-1 py-3.5 sm:py-0 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <Save className="w-5 h-5" /> Salvar
                                </button>
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={() => { setEditingId(null); setForm({ symbol: '', quantity: '', averagePrice: '' }) }}
                                        className="px-4 py-3.5 sm:py-0 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-500/50 rounded-xl transition-all flex items-center justify-center active:scale-95"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-white mb-4 tracking-tight px-1">Ações Cadastradas</h3>

                    {loading ? (
                        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-brand-400" /></div>
                    ) : stocks.length === 0 ? (
                        <p className="text-slate-500 italic text-center py-8 bg-slate-800/20 rounded-2xl border border-slate-800/50">Nenhuma ação cadastrada na sua carteira.</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 sm:gap-4">
                            {stocks.map(stock => (
                                <div key={stock.id} className="glass p-4 sm:p-5 rounded-2xl border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-white/10 transition-all shadow-md group relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4 sm:gap-6 relative z-10 w-full sm:w-auto">
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center font-black text-lg sm:text-xl text-white shadow-sm shrink-0">
                                            {stock.symbol.substring(0, 2)}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight">{stock.symbol}</h4>
                                            <p className="text-slate-400 text-xs sm:text-sm mt-1 sm:space-x-4 flex flex-col sm:flex-row gap-1 sm:gap-0">
                                                <span><strong className="text-slate-300">Qtd:</strong> {stock.quantity}</span>
                                                <span className="hidden sm:inline text-slate-600">•</span>
                                                <span><strong className="text-slate-300">PM:</strong> R$ {parseFloat(stock.averagePrice).toFixed(2)}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-3 relative z-10 w-full sm:w-auto pt-3 sm:pt-0 border-t border-slate-800 sm:border-t-0">
                                        <button
                                            onClick={() => handleEdit(stock)}
                                            className="flex-1 sm:flex-none flex justify-center items-center py-2 sm:p-3 bg-slate-800 hover:bg-brand-600 text-slate-300 hover:text-white rounded-xl transition-all border border-slate-700 hover:border-transparent cursor-pointer shadow-sm active:scale-95"
                                        >
                                            <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(stock.id)}
                                            className="flex-1 sm:flex-none flex justify-center items-center py-2 sm:p-3 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-xl transition-all border border-slate-700 hover:border-transparent cursor-pointer shadow-sm active:scale-95"
                                        >
                                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
