"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Info, Loader2, ArrowUpRight, Zap, Clock, RefreshCw, Activity, Terminal, Coins, Calculator, Flame } from "lucide-react";

const formatBRL = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

function SuggestionCard({ sug }: { sug: any }) {
  const isDividend = sug.reason.includes('DIVIDEND');
  const isTechnical = sug.reason.includes('TÉCNICA');
  const isRecovery = sug.reason.includes('RECOMPOSIÇÃO');

  return (
    <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-2xl hover:bg-slate-800/60 transition-all group relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-1.5 h-full ${isDividend ? 'bg-amber-500' : isTechnical ? 'bg-emerald-500' : 'bg-blue-500'}`} />

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-3">
          {sug.logo && <img src={sug.logo} alt={sug.symbol} className="w-10 h-10 rounded-full bg-white p-1.5 shadow-lg" />}
          <a
            href={`https://statusinvest.com.br/acoes/${sug.symbol.replace('.SA', '').toLowerCase()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-2xl tracking-tight hover:text-emerald-400 transition-colors cursor-pointer underline decoration-dotted decoration-emerald-500/30 underline-offset-4"
          >
            {sug.symbol}
          </a>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${isDividend ? 'text-amber-400 bg-amber-400/10 border border-amber-400/20' : isTechnical ? 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20' : 'text-blue-400 bg-blue-400/10 border border-blue-400/20'}`}>
            {isDividend ? 'Dividendo Alto' : isTechnical ? 'Técnico Forte' : 'Recuperação'}
          </span>
          {sug.dy >= 6 && (
            <span className="text-amber-400 bg-amber-900/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border border-amber-500/20">
              🔥 TOP DY
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-700/30">
          <p className="text-sm text-slate-200 leading-relaxed font-semibold">
            {sug.reason}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
            <span className="text-slate-500 text-[9px] uppercase font-black block mb-1">Preço Atual</span>
            <span className="text-white font-mono text-base font-black">{formatBRL(sug.price)}</span>
          </div>
          <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
            <span className="text-slate-500 text-[9px] uppercase font-black block mb-1">Indicador RSI</span>
            <span className={`font-mono text-base font-black ${sug.rsi < 35 ? 'text-emerald-400' : 'text-slate-300'}`}>{sug.rsi.toFixed(1)}</span>
          </div>
          <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
            <span className="text-slate-500 text-[9px] uppercase font-black block mb-1">Div. Yield</span>
            <span className="text-amber-400 font-mono text-base font-black">{sug.dy.toFixed(2)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<{ portfolio: any[]; suggestions: any[]; trending?: any[]; scanInterval?: number; logs?: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  // Time states
  const [now, setNow] = useState(new Date());
  const [lastScan, setLastScan] = useState<Date | null>(null);
  const [nextScan, setNextScan] = useState<Date | null>(null);
  const [scanMs, setScanMs] = useState(15 * 60 * 1000); // Default 15 mins

  useEffect(() => {
    // Live clock ticks every second
    const clockInterval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    let isMounted = true;
    let currentInterval: NodeJS.Timeout;

    const fetchData = async () => {
      try {
        const res = await fetch("/api/dashboard");
        const json = await res.json();

        if (isMounted) {
          setData(json);
          setLoading(false);

          // Update polling interval dynamically
          const ms = (json.scanInterval || 15) * 60 * 1000;
          setScanMs(ms);

          setLastScan(new Date());
          setNextScan(new Date(Date.now() + ms));

          if (currentInterval) clearInterval(currentInterval);
          currentInterval = setInterval(fetchData, ms);
        }
      } catch (err) {
        console.error(err);
      }
    };

    // Initial fetch
    fetchData();

    return () => {
      isMounted = false;
      if (currentInterval) clearInterval(currentInterval);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center pt-20">
          <Loader2 className="w-12 h-12 text-brand-500 animate-spin mb-4 drop-shadow-lg" />
          <h2 className="text-xl font-medium tracking-wider text-slate-300 animate-pulse">
            Analisando mercado e carteira...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Real-time Status Widget */}
      <div className="mb-8 glass rounded-2xl p-4 sm:p-6 border border-slate-700/50 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-full bg-brand-500/5 blur-[80px]" />

        <div className="flex items-center gap-4 relative z-10 w-full sm:w-auto">
          <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 relative">
            <div className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            <div className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full" />
            <Activity className="w-6 h-6 text-brand-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Status do Sistema</h3>
            <p className="text-white font-medium flex items-center gap-2">
              Escaneamento Automático Ativo
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-12 w-full sm:w-auto text-sm relative z-10">
          <div className="flex flex-col items-center sm:items-end w-full sm:w-auto bg-slate-800/50 sm:bg-transparent p-3 sm:p-0 rounded-xl">
            <span className="text-slate-500 font-semibold mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Horário (Ao Vivo)</span>
            <span className="text-xl font-mono text-slate-200 tracking-wider">
              {now.toLocaleTimeString('pt-BR')}
            </span>
          </div>

          <div className="hidden sm:block w-px h-10 bg-slate-700"></div>

          <div className="flex flex-col items-center sm:items-end w-full sm:w-auto bg-slate-800/50 sm:bg-transparent p-3 sm:p-0 rounded-xl">
            <span className="text-slate-500 font-semibold mb-1 flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Próxima Varredura</span>
            <span className="text-xl font-mono text-brand-400 tracking-wider">
              {nextScan ? nextScan.toLocaleTimeString('pt-BR') : '--:--:--'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-brand-400" />
              Sinais e Alertas
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {data?.portfolio.length === 0 && (
              <div className="glass p-8 rounded-2xl border border-slate-700/50 flex flex-col items-center justify-center text-center">
                <Info className="w-12 h-12 text-brand-400 mb-4 opacity-70" />
                <p className="text-slate-300 font-medium text-lg">Você ainda não adicionou ações na carteira.</p>
                <p className="text-slate-500 text-sm mt-2">Vá na guia &quot;Minha Carteira&quot; para adicionar os ativos que você possui.</p>
              </div>
            )}
            {data?.portfolio.map((item, idx) => {
              const info = item.analysis;
              if (!info) return (
                <div key={idx} className="p-6 rounded-2xl border border-slate-700 glass opacity-80 backdrop-blur-md shadow-xl transition-all">
                  <div className="flex items-center justify-between">
                    <h3 className="text-3xl font-extrabold tracking-tight text-slate-400 mb-2">{item.symbol}</h3>
                    <span className="text-xs px-3 py-1 rounded-full uppercase font-bold tracking-widest border border-rose-500/50 text-rose-400 bg-rose-500/10">ERRO</span>
                  </div>
                  <p className="text-sm text-slate-300 font-medium">Não foi possível carregar os dados ao vivo. Verifique se o ticker da ação existe (ex: PETR4.SA).</p>
                </div>
              );

              const isBuy = info.action === "Buy";
              const isSell = info.action === "Venda";

              const colorClass = isBuy
                ? "border-emerald-500/50 bg-emerald-500/10"
                : isSell
                  ? "border-rose-500/50 bg-rose-500/10"
                  : "border-slate-700 glass";
              const textClass = isBuy ? "text-emerald-400" : isSell ? "text-rose-400" : "text-amber-400";
              const Icon = isBuy ? TrendingUp : isSell ? TrendingDown : Info;

              // Lucro/Prejuízo Calculation
              const totalCost = item.quantity * item.averagePrice;
              const currentValue = item.quantity * info.price;
              const profitLoss = currentValue - totalCost;
              const profitLossPct = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;
              const isProfit = profitLoss >= 0;

              return (
                <div
                  key={idx}
                  className={`p-6 rounded-2xl border backdrop-blur-md shadow-xl transition-all hover:scale-[1.01] ${colorClass}`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                        <a
                          href={`https://statusinvest.com.br/acoes/${item.symbol.replace('.SA', '').toLowerCase()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-emerald-400 transition-colors cursor-pointer underline decoration-dotted decoration-emerald-500/30 underline-offset-4"
                        >
                          {item.symbol}
                        </a>
                        <span
                          className={`text-xs px-3 py-1 rounded-full uppercase font-bold tracking-widest border border-current ${textClass} bg-black/20`}
                        >
                          {info.action}
                        </span>
                      </h3>
                      <p className="text-slate-300 text-sm mt-2 flex items-center gap-2 max-w-xl">
                        <Icon className={`w-4 h-4 ${textClass}`} />
                        {info.reason}
                      </p>
                    </div>

                    <div className="flex gap-6 text-right w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-700/50">
                      <div>
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-1">Preço Atual</p>
                        <p className="text-2xl font-semibold">{formatBRL(info.price)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-1">RSI (14)</p>
                        <p className={`text-xl font-semibold ${info.rsi < 30 ? 'text-emerald-400' : info.rsi > 70 ? 'text-rose-400' : 'text-slate-200'}`}>
                          {info.rsi.toFixed(1)}
                        </p>
                      </div>
                      <div className="pl-4 border-l border-slate-700/50">
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-1">Performance</p>
                        <p className={`text-xl font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isProfit ? '+' : ''}{formatBRL(profitLoss)}
                          <span className="text-xs ml-1 opacity-70">({profitLossPct.toFixed(2)}%)</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Micro Chart / Details bar */}
                  <div className="mt-6 flex justify-between text-xs font-medium text-slate-400 bg-slate-900/40 p-3 rounded-xl border border-slate-800/50">
                    <span>SMA 50: {formatBRL(info.sma50)}</span>
                    <span>SMA 200: {formatBRL(info.sma200)}</span>
                    <span>Média Pago: {formatBRL(item.averagePrice)}</span>
                    <span>Qtd: {item.quantity}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Suggestion Section - Moved to main column */}
          <div className="mt-12 space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <ArrowUpRight className="w-6 h-6 text-brand-400" />
              Oportunidades
            </h2>

            <div className="glass rounded-3xl p-6 border border-slate-700/60 shadow-2xl">
              <p className="text-slate-400 text-sm mb-6">Nosso scanner detectou as seguintes oportunidades de <span className="text-emerald-400 font-bold uppercase">Compra</span> no mercado hoje:</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data?.suggestions.length === 0 && (
                  <p className="text-sm text-slate-500 italic col-span-2">Nenhuma oportunidade forte de compra encontrada neste momento pelas métricas de RSI e Tendência.</p>
                )}
                {data?.suggestions.map((sug, idx) => (
                  <SuggestionCard key={idx} sug={sug} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Trending & Logs Side Grid */}
        <div className="space-y-8">

          {/* Trending Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-500" />
              Melhores Tendências
            </h2>

            <div className="glass rounded-3xl p-6 border border-slate-700/60 shadow-2xl">
              <p className="text-slate-400 text-sm mb-6">Projeção Rápida: Ativos com forte ímpeto de alta no curto prazo.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(!data?.trending || data.trending.length === 0) && (
                  <p className="text-sm text-slate-500 italic col-span-2">Nenhuma tendência forte detectada no momento.</p>
                )}
                {data?.trending?.map((trend, idx) => (
                  <div key={idx} className="bg-slate-800/60 p-3 rounded-xl border border-orange-500/20 hover:border-orange-500/60 transition-colors flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        {trend.logo && <img src={trend.logo} alt={trend.symbol} className="w-6 h-6 rounded-full bg-white p-0.5" />}
                        <a
                          href={`https://statusinvest.com.br/acoes/${trend.symbol.replace('.SA', '').toLowerCase()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold hover:text-orange-400 transition-colors cursor-pointer"
                        >
                          {trend.symbol}
                        </a>
                      </div>
                      <span className="text-[10px] font-black uppercase bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/30">🔥 Quente</span>
                    </div>

                    <div className="font-mono text-lg font-black mb-1">{formatBRL(trend.price)}</div>

                    <div className="flex justify-between text-[11px] mt-2 border-t border-slate-700/50 pt-2">
                      <span className="text-slate-400">Var 24h: <span className="text-emerald-400 font-bold ml-1">+{trend.changePercent.toFixed(2)}%</span></span>
                      <span className="text-slate-400">RSI: <span className="text-white ml-1">{trend.rsi.toFixed(0)}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Logs Section */}
          <div className="mt-8 space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Terminal className="w-6 h-6 text-indigo-400" />
              Logs de Interações
            </h2>

            <div className="glass rounded-3xl p-6 border border-slate-700/60 shadow-2xl h-80 overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                {(!data?.logs || data.logs.length === 0) && (
                  <p className="text-sm text-slate-500 italic">O sistema ainda não gerou nenhum registro.</p>
                )}

                {data?.logs?.map((log, idx) => {
                  const isSuccess = log.level === 'success';
                  const isWarning = log.level === 'warning';

                  return (
                    <div key={idx} className="flex gap-4 p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
                      <div className="pt-0.5">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${isSuccess ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-brand-500'}`} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1 font-mono">{new Date(log.createdAt).toLocaleString('pt-BR')}</p>
                        <p className={`text-sm ${isSuccess ? 'text-emerald-50' : isWarning ? 'text-amber-50' : 'text-slate-300'}`}>{log.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
