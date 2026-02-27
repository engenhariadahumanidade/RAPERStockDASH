import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { analyzeStock, getTopSuggestions, getTrendingStocks } from '@/lib/yahoo-finance';
import { processAlerts } from '@/services/alert.service';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const triggerAlert = searchParams.get('triggerAlert') === 'true';

        // 1. Fetch initial requirements concurrently
        const [portfolio, suggestions, settings, trending] = await Promise.all([
            prisma.stock.findMany(),
            getTopSuggestions(),
            prisma.settings.findFirst(),
            getTrendingStocks()
        ]);

        // 2. Map and analyze Portfolio concurrently
        let alerts: string[] = [];
        const analyzedPortfolio = await Promise.all(
            portfolio.map(async (stock) => {
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
            await processAlerts(alerts, suggestions, settings);
        }

        // Fetch last 5 logs for updating the dashboard
        const logs = await (prisma as any).systemLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        return NextResponse.json({
            portfolio: analyzedPortfolio,
            suggestions,
            trending,
            scanInterval: settings?.scanInterval || 15,
            logs
        });

    } catch (error) {
        return NextResponse.json({ error: 'Erro ao analisar dashboard', details: String(error) }, { status: 500 });
    }
}
