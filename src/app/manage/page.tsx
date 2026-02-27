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
        <div className="flex flex-col min-h-screen">
            <Navbar />

            <div className="flex-1 w-full max-w-4xl mx-auto space-y-8 mt-4">
                <div className="glass p-8 rounded-3xl border border-slate-700/50 shadow-2xl">
                    <h2 className="text-3xl font-extrabold text-white mb-6 flex items-center gap-3">
                        <span className="bg-brand-500/20 text-brand-400 p-2 rounded-xl"><Plus className="w-6 h-6" /></span>
                        {editingId ? "Editar Ação" : "Adicionar Nova Ação"}
                    </h2>

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Ativo</label>
                            <input
                                type="text"
                                placeholder="Ex: PETR4.SA"
                                value={form.symbol}
                                onChange={e => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-mono uppercase"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Qtd</label>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0"
                                value={form.quantity}
                                onChange={e => setForm({ ...form, quantity: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Preço Médio</label>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="R$ 0.00"
                                value={form.averagePrice}
                                onChange={e => setForm({ ...form, averagePrice: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                                required
                            />
                        </div>
                        <div className="flex gap-2 h-[50px]">
                            <button
                                type="submit"
                                className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20"
                            >
                                <Save className="w-5 h-5" /> Salvar
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={() => { setEditingId(null); setForm({ symbol: '', quantity: '', averagePrice: '' }) }}
                                    className="px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors flex items-center justify-center"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-white mb-4">Ações Cadastradas</h3>

                    {loading ? (
                        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-brand-400" /></div>
                    ) : stocks.length === 0 ? (
                        <p className="text-slate-500 italic text-center py-8 bg-slate-800/20 rounded-2xl border border-slate-800/50">Nenhuma ação cadastrada na sua carteira.</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {stocks.map(stock => (
                                <div key={stock.id} className="glass p-5 rounded-2xl border border-slate-700 flex justify-between items-center hover:border-slate-500 transition-colors">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-xl text-white border border-slate-700/50">
                                            {stock.symbol.substring(0, 2)}
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-black text-white tracking-tight">{stock.symbol}</h4>
                                            <p className="text-slate-400 text-sm mt-1 space-x-4">
                                                <span><strong className="text-slate-300">Qtd:</strong> {stock.quantity}</span>
                                                <span><strong className="text-slate-300">PM:</strong> R$ {parseFloat(stock.averagePrice).toFixed(2)}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleEdit(stock)}
                                            className="p-3 bg-slate-800 hover:bg-brand-600 text-slate-300 hover:text-white rounded-xl transition-colors border border-transparent shadow-sm hover:shadow-brand-500/20"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(stock.id)}
                                            className="p-3 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-xl transition-colors border border-transparent shadow-sm hover:shadow-rose-500/20"
                                        >
                                            <Trash2 className="w-5 h-5" />
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
