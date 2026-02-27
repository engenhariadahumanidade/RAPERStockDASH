import axios from 'axios';

// Type definitions
export interface StockAnalysis {
    symbol: string;
    price: number;
    changePercent: number;
    rsi: number;
    sma50: number;
    sma200: number;
    action: 'Buy' | 'Venda' | 'Hold';
    reason: string;
    dy: number;
    logo: string;
}

// Helper to calculate SMA
function calculateSMA(data: number[], period: number) {
    if (data.length < period) return null;
    const slice = data.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
}

// Helper to calculate RSI
function calculateRSI(data: number[], period = 14) {
    if (data.length < period + 1) return null;

    let gains = 0;
    let losses = 0;

    for (let i = data.length - period; i < data.length; i++) {
        const diff = data[i] - data[i - 1];
        if (diff >= 0) {
            gains += diff;
        } else {
            losses -= diff;
        }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
}

export async function analyzeStock(symbol: string): Promise<StockAnalysis | null> {
    try {
        // Strip .SA for BRAPI if present, though BRAPI generally handles it
        const cleanSymbol = symbol.replace('.SA', '').trim();

        // Use BRAPI with fundamental=true to get dividends
        const response = await axios.get(`https://brapi.dev/api/quote/${cleanSymbol}?range=3mo&interval=1d&fundamental=true&dividends=true&token=6YU7waZ3NKfyjGYecT99mN`);

        if (!response.data || !response.data.results || response.data.results.length === 0) {
            return null;
        }

        const result = response.data.results[0];
        const historical = result.historicalDataPrice || [];

        const closes = historical.map((d: any) => typeof d.close === 'number' ? d.close : null).filter((c: any) => c !== null);

        const price = result.regularMarketPrice || (closes.length > 0 ? closes[closes.length - 1] : 0);
        const changePercent = result.regularMarketChangePercent || 0;

        if (price === 0) return null; // Complete failure

        // Calculate indicators based on available data
        // BRAPI free tier gives 3 months history (around 60 trading days) - sufficient for SMA 50 and RSI
        const rsi = closes.length >= 15 ? (calculateRSI(closes) || 50) : 50;
        const sma50 = closes.length >= 50 ? (calculateSMA(closes, 50) || price) : price;
        const sma200 = closes.length >= 200 ? (calculateSMA(closes, 200) || sma50) : sma50; // Fallback to sma50 if not enough data for 200

        // Calculate DY (Dividend Yield for the last 12 months)
        let dy = 0;
        const dividendsData = result.dividendsData?.cashDividends || [];
        if (dividendsData.length > 0 && price > 0) {
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

            const lastYearDividends = dividendsData.filter((d: any) => {
                // BRAPI returns dates like ISO strings or 'DD/MM/YYYY HH:MM:SS', let's parse safely
                if (typeof d.paymentDate === 'string') {
                    const parts = d.paymentDate.split('/');
                    if (parts.length >= 3) {
                        const date = new Date(`${parts[2].split(' ')[0]}-${parts[1]}-${parts[0]}T00:00:00.000Z`);
                        return date >= oneYearAgo;
                    }
                    return new Date(d.paymentDate) >= oneYearAgo;
                }
                return false;
            });

            const totalDividends = lastYearDividends.reduce((acc: number, d: any) => acc + (Number(d.rate) || 0), 0);
            dy = (totalDividends / price) * 100;
        }

        let action: 'Buy' | 'Venda' | 'Hold' = 'Hold';
        let reason = 'Mercado lateralizado, sem sinais claros.';

        if (rsi < 30 && price > sma200) {
            action = 'Buy';
            reason = 'Ativo sobrevendido (RSI < 30) em tendência de alta.';
        } else if (rsi > 70 && price < sma200) {
            action = 'Venda';
            reason = 'Ativo sobrecomprado (RSI > 70) em tendência de baixa.';
        } else if (sma50 > sma200 && rsi < 50) {
            action = 'Buy';
            reason = 'Golden Cross (SMA50 > SMA200) em correção (RSI < 50).';
        } else if (sma50 < sma200 && rsi > 50) {
            action = 'Venda';
            reason = 'Death Cross (SMA50 < SMA200) e possível topo local (RSI > 50).';
        } else if (rsi < 35) {
            action = 'Buy';
            reason = 'Ativo perto de sobrevenda extrema (RSI < 35).';
        } else if (rsi > 65) {
            action = 'Venda';
            reason = 'Ativo perto de sobrecompra extrema (RSI > 65).';
        }

        return {
            symbol,
            price: Number(price.toFixed(2)),
            changePercent: Number(changePercent.toFixed(2)),
            rsi: Number(rsi.toFixed(2)),
            sma50: Number(sma50.toFixed(2)),
            sma200: Number(sma200.toFixed(2)),
            action,
            reason,
            dy: Number(dy.toFixed(2)),
            logo: result.logourl || '',
        };
    } catch (error) {
        console.error(`Error analyzing ${symbol}:`, error);
        return null;
    }
}

export async function getTopSuggestions(): Promise<StockAnalysis[]> {
    // Extended list of top B3 stocks for more dynamic scanning
    const allCandidates = [
        'PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'ABEV3', 'WEGE3', 'BBAS3', 'B3SA3',
        'PETR3', 'ITSA4', 'EGIE3', 'TRPL4', 'VBBR3', 'RENT3', 'PRIO3', 'CSNA3',
        'ELET3', 'GGBR4', 'SANB11', 'LREN3', 'SUZB3', 'KLBN11', 'RADL3', 'EQTL3'
    ];

    // Shuffle and pick 12 at random for each scan (prevents static list)
    const candidates = [...allCandidates].sort(() => 0.5 - Math.random()).slice(0, 12);

    const results: StockAnalysis[] = [];
    const analyses = await Promise.all(candidates.map(sym => analyzeStock(sym)));

    // Categorize and filter results
    analyses.forEach(analysis => {
        if (!analysis) return;

        // Rule 1: High Conviction (RSI < 30)
        if (analysis.rsi < 32 && analysis.action === 'Buy') {
            analysis.reason = '💎 OPORTUNIDADE TÉCNICA: Ativo em sobrevenda extrema + RSI abaixo de 32.';
            results.push(analysis);
        }
        // Rule 2: Dividend King (DY > 8%)
        else if (analysis.dy >= 8.0) {
            analysis.reason = '💰 DIVIDEND KING: Excelente retorno de dividendos (>8%) com preço estável.';
            results.push(analysis);
        }
        // Rule 3: Recovery Signal (RSI < 45 and SMA Cross or Bullish Bias)
        else if (analysis.rsi < 45 && analysis.price > analysis.sma50) {
            analysis.reason = '🚀 RECOMPOSIÇÃO: Em recuperação técnica, preço acima da média de 50 dias.';
            results.push(analysis);
        }
    });

    // Return unique results, sorted by RSI (lowest first = better buy)
    return results
        .filter((v, i, a) => a.findIndex(t => t.symbol === v.symbol) === i)
        .sort((a, b) => a.rsi - b.rsi)
        .slice(0, 4);
}

export async function getTrendingStocks(): Promise<StockAnalysis[]> {
    const candidates = ['MGLU3', 'B3SA3', 'WEGE3', 'ELET3', 'RENT3', 'PRIO3', 'SUZB3', 'RADL3', 'EQTL3', 'VIVT3'];
    const results: StockAnalysis[] = [];

    const analyses = await Promise.all(candidates.map(sym => analyzeStock(sym)));

    analyses.forEach(analysis => {
        // We consider a stock "trending" if it has positive changePercent, RSI between 50 and 70, and price > sma50
        if (analysis && analysis.changePercent > 0 && analysis.rsi >= 50 && analysis.rsi <= 70 && analysis.price > analysis.sma50) {
            results.push(analysis);
        }
    });

    // Fallback if we don't have enough, just get the most positive ones among analyses
    if (results.length < 6) {
        const remaining = analyses
            .filter((a): a is StockAnalysis => a !== null && !results.find(r => r.symbol === a.symbol))
            .sort((a, b) => b.changePercent - a.changePercent);

        for (const item of remaining) {
            if (results.length >= 6) break;
            results.push(item);
        }
    }

    return results.slice(0, 6).sort((a, b) => b.changePercent - a.changePercent);
}
