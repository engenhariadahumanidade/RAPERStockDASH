"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { TrendingUp, TrendingDown, Info, Loader2, ArrowUpRight, Zap, Terminal, Flame, Eye } from "lucide-react";

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

  const themeColor = isDividend ? 'amber' : isTechnical ? 'emerald' : 'blue';

  return (
    <div className="bg-slate-900 border border-slate-700/60 p-5 sm:p-6 rounded-3xl hover:border-slate-500 transition-all group relative overflow-hidden flex flex-col justify-between h-full shadow-2xl">
      <div className={`absolute top-0 left-0 w-full h-1.5 bg-${themeColor}-500/80 group-hover:bg-${themeColor}-400 transition-colors`} />

      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3 sm:gap-4">
          {sug.logo ? (
            <img src={sug.logo} alt={sug.symbol} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white p-1 shadow-sm" />
          ) : (
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center`}>
              <span className="text-slate-400 font-bold">{sug.symbol.substring(0, 1)}</span>
            </div>
          )}
          <div>
            <a
              href={`https://statusinvest.com.br/acoes/${sug.symbol.replace('.SA', '').toLowerCase()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-black text-xl sm:text-2xl tracking-tighter text-slate-100 hover:text-white transition-colors cursor-pointer"
            >
              {sug.symbol}
            </a>
            <div className="mt-1 flex flex-wrap gap-2">
              <span className={`px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-black uppercase tracking-wider text-${themeColor}-400 bg-${themeColor}-500/10 border border-${themeColor}-500/20`}>
                {isDividend ? 'Foco em Dividendos' : isTechnical ? 'Técnica Forte' : 'Recuperação'}
              </span>
              {sug.dy >= 6 && (
                <span className="text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-black uppercase tracking-wider border border-orange-500/20">
                  🔥 Alto DY
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
          {sug.reason}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-slate-950/80 p-3 sm:p-4 rounded-2xl border border-slate-800">
            <span className="text-slate-500 text-[10px] sm:text-xs uppercase font-bold tracking-widest block mb-1">Preço Atual</span>
            <span className="text-white font-mono text-base sm:text-lg font-black">{formatBRL(sug.price)}</span>
          </div>
          <div className="bg-slate-950/80 p-3 sm:p-4 rounded-2xl border border-slate-800">
            <span className="text-slate-500 text-[10px] sm:text-xs uppercase font-bold tracking-widest block mb-1">RSI (14)</span>
            <span className={`font-mono text-base sm:text-lg font-black ${sug.rsi < 35 ? 'text-emerald-400' : 'text-slate-300'}`}>{sug.rsi.toFixed(1)}</span>
          </div>
          <div className="bg-slate-950/80 p-3 sm:p-4 rounded-2xl border border-slate-800 md:col-span-1 col-span-2">
            <span className="text-slate-500 text-[10px] sm:text-xs uppercase font-bold tracking-widest block mb-1">Div. Yield</span>
            <span className="text-amber-400 font-mono text-base sm:text-lg font-black">{sug.dy.toFixed(2)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  console.log("RAPERStockDASH - Versão 4.2.2 - MULTI-TENANT");
  const [data, setData] = useState<{ portfolio: any[]; suggestions: any[]; trending?: any[]; scanInterval?: number; logs?: any[]; userName?: string } | null>(null);
  const [loading, setLoading] = useState(true);



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

          const ms = (json.scanInterval || 15) * 60 * 1000;

          if (currentInterval) clearInterval(currentInterval);
          currentInterval = setInterval(fetchData, ms);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      if (currentInterval) clearInterval(currentInterval);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-950">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <Loader2 className="w-16 h-16 text-emerald-500 animate-spin mb-6" />
          <h2 className="text-2xl font-bold tracking-tight text-white animate-pulse">
            Analisando mercado e sua carteira...
          </h2>
          <p className="text-slate-400 mt-2 font-medium">Buscando os melhores ativos e dados em tempo real</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 pb-24">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 space-y-12">



        {/* --- SINAIS DA CARTEIRA --- */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Eye className="w-7 h-7 text-white" />
            <h2 className="text-3xl font-black text-white tracking-tighter">Minha Carteira ao Vivo</h2>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {data?.portfolio.length === 0 && (
              <div className="bg-slate-900 border border-slate-800 p-12 rounded-3xl flex flex-col items-center justify-center text-center">
                <Info className="w-16 h-16 text-slate-600 mb-6" />
                <p className="text-white font-bold text-xl md:text-2xl mb-2 tracking-tight">Sem ativos monitorados</p>
                <p className="text-slate-400 md:text-lg max-w-md">Gerencie sua carteira adicionando ações na página "Minha Carteira" para obter análises em tempo real.</p>
              </div>
            )}

            {data?.portfolio.map((item, idx) => {
              const info = item.analysis;
              if (!info) return (
                <div key={idx} className="bg-slate-900 border border-rose-500/30 p-6 sm:p-8 rounded-3xl shadow-xl">
                  <div className="flex items-center gap-4 mb-3">
                    <h3 className="text-2xl font-black text-slate-300 tracking-tighter">{item.symbol}</h3>
                    <span className="px-3 py-1 bg-rose-500/10 text-rose-400 font-bold text-[10px] uppercase tracking-widest rounded-md border border-rose-500/20">Sem Dados</span>
                  </div>
                  <p className="text-slate-400">Verifique se o ticker é válido (ex: VALE3.SA).</p>
                </div>
              );

              const isBuy = info.action === "Buy";
              const isSell = info.action === "Venda";

              const borderColor = isBuy ? "border-emerald-500/40" : isSell ? "border-rose-500/40" : "border-slate-700/60";
              const bgColor = isBuy ? "bg-emerald-500/5 hover:bg-emerald-500/10" : isSell ? "bg-rose-500/5 hover:bg-rose-500/10" : "bg-slate-900 hover:bg-slate-800";
              const indicatorColor = isBuy ? "bg-emerald-500" : isSell ? "bg-rose-500" : "bg-slate-500";
              const badgeColor = isBuy ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : isSell ? "text-rose-400 bg-rose-500/10 border-rose-500/20" : "text-amber-400 bg-amber-500/10 border-amber-500/20";

              const totalCost = item.quantity * item.averagePrice;
              const currentValue = item.quantity * info.price;
              const profitLoss = currentValue - totalCost;
              const profitLossPct = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;
              const isProfit = profitLoss >= 0;

              return (
                <div key={idx} className={`relative p-6 sm:p-8 rounded-3xl border transition-all duration-300 ${borderColor} ${bgColor} shadow-2xl overflow-hidden group`}>
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${indicatorColor} opacity-80`} />

                  <div className="flex flex-col xl:flex-row justify-between items-start gap-6 sm:gap-8">
                    <div className="w-full xl:w-1/2">
                      <div className="flex flex-wrap items-center gap-4 mb-3">
                        <a href={`https://statusinvest.com.br/acoes/${item.symbol.replace('.SA', '').toLowerCase()}`} target="_blank" rel="noopener noreferrer" className="text-3xl sm:text-4xl font-black text-white tracking-tighter hover:text-brand-400 transition-colors">
                          {item.symbol}
                        </a>
                        <span className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-black uppercase tracking-widest border ${badgeColor}`}>
                          Recomendação: {info.action}
                        </span>
                      </div>
                      <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-medium">
                        {info.reason}
                      </p>
                    </div>

                    <div className="w-full xl:w-auto grid grid-cols-2 md:grid-cols-4 xl:flex xl:flex-row gap-4 sm:gap-6 pt-6 xl:pt-0 border-t xl:border-t-0 border-slate-800/80 mt-2 xl:mt-0">
                      <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
                        <span className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest block mb-1">Preço Atual</span>
                        <span className="text-white font-mono text-lg sm:text-xl font-black">{formatBRL(info.price)}</span>
                      </div>
                      <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
                        <span className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest block mb-1">RSI (14)</span>
                        <span className={`font-mono text-lg sm:text-xl font-black ${info.rsi < 30 ? 'text-emerald-400' : info.rsi > 70 ? 'text-rose-400' : 'text-slate-300'}`}>
                          {info.rsi.toFixed(1)}
                        </span>
                      </div>
                      <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800 md:col-span-2 xl:col-span-1 min-w-[180px]">
                        <span className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest block mb-1">Sua Performance</span>
                        <div className="flex items-baseline gap-2">
                          <span className={`text-lg sm:text-xl font-black font-mono tracking-tight ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isProfit ? '+' : ''}{formatBRL(profitLoss)}
                          </span>
                          <span className={`text-sm font-bold ${isProfit ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>
                            ({profitLossPct.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 flex flex-wrap gap-4 text-xs font-bold tracking-widest uppercase text-slate-500 border-t border-slate-800/80">
                    <span className="px-3 py-1.5 bg-slate-950/50 rounded-lg">Média: {formatBRL(item.averagePrice)}</span>
                    <span className="px-3 py-1.5 bg-slate-950/50 rounded-lg">Qtde: {item.quantity} un</span>
                    <span className="px-3 py-1.5 bg-slate-950/50 rounded-lg">SMA 50: {formatBRL(info.sma50)}</span>
                    <span className="px-3 py-1.5 bg-slate-950/50 rounded-lg">SMA 200: {formatBRL(info.sma200)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* --- GRID DIVIDIDO: OPORTUNIDADES & TENDÊNCIAS --- */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">

          <section className="xl:col-span-3 space-y-6">
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <Zap className="w-6 h-6 text-brand-400 fill-brand-400/20" />
              Top Oportunidades do Scanner
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {data?.suggestions.length === 0 && (
                <div className="col-span-1 md:col-span-2 p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center">
                  <p className="text-slate-400 font-medium">Nenhuma oportunidade forte detectada no momento.</p>
                </div>
              )}
              {data?.suggestions.map((sug, idx) => (
                <SuggestionCard key={idx} sug={sug} />
              ))}
            </div>
          </section>

          <section className="xl:col-span-2 space-y-6">
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <Flame className="w-6 h-6 text-orange-500 fill-orange-500/20" />
              Ações em Alta Tensão
            </h2>

            <div className="bg-slate-900 p-6 rounded-3xl border border-orange-500/20 hover:border-orange-500/40 transition-colors shadow-2xl flex flex-col gap-4">
              {(!data?.trending || data.trending.length === 0) ? (
                <p className="text-slate-400 text-sm font-medium">Mercado estável. Nenhuma distorção grave encontrada.</p>
              ) : (
                data.trending.map((trend, idx) => (
                  <div key={idx} className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3 w-1/2">
                      {trend.logo ? (
                        <img src={trend.logo} alt={trend.symbol} className="w-8 h-8 rounded-full bg-white p-0.5 shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 font-bold text-xs flex items-center justify-center shrink-0 text-slate-400">{trend.symbol.charAt(0)}</div>
                      )}
                      <a href={`https://statusinvest.com.br/acoes/${trend.symbol.replace('.SA', '').toLowerCase()}`} target="_blank" rel="noopener noreferrer" className="font-black text-lg text-white hover:text-orange-400 transition-colors truncate">
                        {trend.symbol}
                      </a>
                    </div>

                    <div className="text-right w-1/2">
                      <div className="font-mono text-lg font-black text-white">{formatBRL(trend.price)}</div>
                      <div className="flex items-center justify-end gap-2 text-xs font-bold mt-1">
                        <span className="text-emerald-400">+{trend.changePercent.toFixed(2)}%</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400">RSI <span className="text-orange-400">{trend.rsi.toFixed(0)}</span></span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-8 pt-8">
              <h2 className="text-xl font-black text-white flex items-center gap-3 mb-6">
                <Terminal className="w-5 h-5 text-indigo-400" />
                Log do Sistema
              </h2>
              <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 h-[280px] overflow-y-auto custom-scrollbar shadow-inner">
                <div className="space-y-3">
                  {(!data?.logs || data.logs.length === 0) && (
                    <p className="text-sm text-slate-500 font-medium">Os registros do motor aparecerão aqui.</p>
                  )}
                  {data?.logs?.map((log, idx) => {
                    const isSuccess = log.level === 'success';
                    const isWarning = log.level === 'warning';

                    return (
                      <div key={idx} className="flex items-start gap-3 pb-3 border-b border-slate-800/60 last:border-0 last:pb-0">
                        <div className={`w-2 h-2 shrink-0 rounded-full mt-1.5 ${isSuccess ? 'bg-emerald-500' : isWarning ? 'bg-orange-500' : 'bg-brand-500'} shadow-[0_0_8px_currentColor]`} />
                        <div>
                          <div className="text-[10px] text-slate-500 font-mono font-bold tracking-widest uppercase mb-0.5">{new Date(log.createdAt).toLocaleTimeString('pt-BR')}</div>
                          <p className={`text-sm font-medium leading-snug ${isSuccess ? 'text-emerald-100' : isWarning ? 'text-orange-100' : 'text-slate-300'}`}>{log.message}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
