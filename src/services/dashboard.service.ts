import prisma from '@/lib/prisma';
import { analyzeStock, getTopSuggestions, getTrendingStocks } from '@/lib/yahoo-finance';
import { processAlerts } from '@/services/alert.service';

export async function runDashboardAnalysis(triggerAlert: boolean = false) {
    // 1. Fetch initial requirements concurrently
    const [portfolio, suggestions, settings, trending] = await Promise.all([
        prisma.stock.findMany(),
        getTopSuggestions(),
        prisma.settings.findFirst(),
        getTrendingStocks()
    ]);

    // 2. Map and analyze Portfolio concurrently
    const alerts: string[] = [];
    const analyzedPortfolio = await Promise.all(
        portfolio.map(async (stock: any) => {
            const analysis = await analyzeStock(stock.symbol);
            if (analysis) {
                if (analysis.action !== 'Hold') {
                    alerts.push(`[${analysis.symbol}] - SINAL DE ${analysis.action.toUpperCase()}: ${analysis.reason} (Preço: R$ ${analysis.price.toFixed(2).replace('.', ',')} | RSI: ${analysis.rsi})`);
                }
                return { ...stock, analysis };
            }
            return { ...stock, analysis: null };
        })
    );

    // 3. Send Alerts if requested
    if (triggerAlert) {
        await processAlerts(alerts, suggestions, settings, trending, analyzedPortfolio);
    }

    // Fetch last 5 logs
    const logs = await (prisma as any).systemLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    });

    return {
        portfolio: analyzedPortfolio,
        suggestions,
        trending,
        scanInterval: settings?.scanInterval || 15,
        logs
    };
}
