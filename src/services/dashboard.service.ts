import prisma from '@/lib/prisma';
import { analyzeStock, getTopSuggestions, getTrendingStocks } from '@/lib/yahoo-finance';
import { processAlerts } from '@/services/alert.service';

export async function runDashboardAnalysis(userId: string, triggerAlert: boolean = false, isTest: boolean = false) {
    if (!userId) {
        throw new Error("userId required for dashboard analysis");
    }

    // 1. Fetch initial requirements concurrently
    const [portfolio, suggestions, settings, trending, user] = await Promise.all([
        prisma.stock.findMany({ where: { userId } }),
        getTopSuggestions(),
        prisma.settings.findUnique({ where: { userId } }),
        getTrendingStocks(),
        prisma.user.findUnique({ where: { id: userId } })
    ]);

    // Extract raw email prefix as user name
    const userName = user?.email?.split('@')[0] || "Investidor";

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
    if (triggerAlert && settings) {
        await processAlerts(alerts, suggestions, settings, trending, analyzedPortfolio, userId, userName, isTest);
    }

    // Fetch last 5 logs for user
    let logs = await prisma.systemLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5
    });

    if (!triggerAlert) {
        logs = [
            {
                id: 999999,
                userId,
                message: "✅ Varredura em tempo real via interface concluída.",
                level: "info",
                createdAt: new Date()
            },
            ...logs
        ];
    } else if (logs.length === 0) {
        logs.push({
            id: 0,
            userId,
            message: "⚡ Motor RAPERStock ativado e monitorando carteira.",
            level: "success",
            createdAt: new Date()
        });
    }

    // Keep only 5 to display
    logs = logs.slice(0, 5);

    return {
        portfolio: analyzedPortfolio,
        suggestions,
        trending,
        scanInterval: settings?.scanInterval || 15,
        logs,
        userName
    };
}
