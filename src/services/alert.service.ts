import prisma from '@/lib/prisma';
import { sendWebhookMessage } from '@/lib/webhook';
import crypto from 'crypto';
import { StockAnalysis } from '@/lib/yahoo-finance';

export async function processAlerts(alerts: string[], suggestions: StockAnalysis[], settings: any, trending: StockAnalysis[] = [], allPortfolio: any[] = []) {
    if (!settings?.webhookUrl || !settings?.phoneNumber || !settings.autoAlerts) {
        return;
    }

    const alertsText = alerts.length > 0 ? alerts.join('\n') : 'Sem sinais de compra/venda relevantes no momento.';
    const suggestionsText = suggestions.length > 0
        ? suggestions.map((s: any) => `• [${s.symbol}] - Motivo: ${s.reason} \n  (Preço: R$ ${s.price.toFixed(2).replace('.', ',')})`).join('\n')
        : 'Nenhuma grande oportunidade no momento.';

    // Calculate hash of the core content (signals only) to detect changes
    const contentForHash = alertsText + suggestionsText;
    const activeHash = crypto.createHash('md5').update(contentForHash).digest('hex');
    const isChanged = settings.lastAlertHash !== activeHash;

    const now = new Date();
    const minutes = now.getMinutes();
    const isCloseToNextHour = minutes >= 55;

    // Duplicity prevention: Avoid sending multiple alerts too close together (cooldown 2 min)
    const lastAlertTime = settings.lastAlertTime ? new Date(settings.lastAlertTime) : null;
    const secondsSinceLast = lastAlertTime ? (now.getTime() - lastAlertTime.getTime()) / 1000 : 9999;

    if (secondsSinceLast < 120) {
        return; // Duplicate prevention
    }

    const currentHourStart = new Date(now);
    currentHourStart.setMinutes(0, 0, 0);

    const lastAlertHourNormalized = lastAlertTime ? new Date(lastAlertTime) : null;
    if (lastAlertHourNormalized) {
        lastAlertHourNormalized.setMinutes(0, 0, 0);
    }

    const isFirstTime = !lastAlertTime;
    const isNewHour = !lastAlertHourNormalized || currentHourStart.getTime() > lastAlertHourNormalized.getTime();

    // Priority Rule: If signals changed but we are close to the next hour, skip to wait for the full report.
    if (!isNewHour && isChanged && isCloseToNextHour) {
        await (prisma as any).systemLog.create({
            data: {
                message: "⏳ Sinais detectados, porém postergados para o boletim da hora cheia (Faltam < 5min).",
                level: "info"
            }
        });
        return;
    }

    const shouldSend = isFirstTime || isNewHour || isChanged;

    if (!shouldSend) {
        await (prisma as any).systemLog.create({
            data: {
                message: "✅ Varredura concluída. Sem sinais novos. Aguardando a próxima hora cheia.",
                level: "info"
            }
        });
        return;
    }

    // Prepare Extra Info
    const topTrends = trending.slice(0, 3).map(t => `🔥 [${t.symbol}] +${t.changePercent}% (RSI: ${t.rsi})`).join('\n') || 'Buscando tendências...';
    const avgRsi = allPortfolio.reduce((acc, curr) => acc + (curr.analysis?.rsi || 50), 0) / (allPortfolio.length || 1);

    let panorama = "";
    if (avgRsi < 40) panorama = "O mercado parece estar em fase de correção ou acumulação. Muitos ativos estão em zonas de desconto.";
    else if (avgRsi > 65) panorama = "O momento é de euforia. Vários ativos estão esticados e o risco de correção local aumentou.";
    else panorama = "O mercado segue em equilíbrio lateral. Excelente para observar suportes e entradas pontuais.";

    const highlights = allPortfolio
        .filter(p => p.analysis && (p.analysis.rsi < 35 || p.analysis.rsi > 65))
        .map(p => `• ${p.symbol}: ${p.analysis.rsi < 35 ? 'Oportunidade de Preço' : 'Alerta de Topo'} (RSI ${p.analysis.rsi})`)
        .join('\n') || "Carteira estável dentro das médias.";

    let templateToUse = settings.customMessage || "Sinais:\n{{alerts}}\n\nDicas:\n{{suggestions}}";

    const spHour = now.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', hour12: false }).split(':')[0];

    // Use full report for new hours or first alert
    if ((isNewHour || isFirstTime) && !templateToUse.includes('{{panorama}}')) {
        templateToUse = `🕘 *BOLETIM DAS ${spHour}h - PANORAMA DO MERCADO* 🕘\n\n` +
            `📊 *PANORAMA GERAL:*\n{{panorama}}\n\n` +
            `📈 *TENDÊNCIAS QUENTES:*\n{{trends}}\n\n` +
            `💼 *DESTAQUES CARTEIRA:*\n{{highlights}}\n\n` +
            `🚨 *SINAIS/ALERTAS:*\n{{alerts}}\n\n` +
            `💡 *DICAS DO SCANNER:*\n{{suggestions}}\n\n` +
            `⚠️ *ATENÇÃO:* Evite entradas pesadas sem confirmação.`;
    }

    const replaceAll = (str: string, tag: string, val: string) => str.split(`{{${tag}}}`).join(val);
    let finalMsg = templateToUse;
    finalMsg = replaceAll(finalMsg, 'alerts', alertsText);
    finalMsg = replaceAll(finalMsg, 'suggestions', suggestionsText);
    finalMsg = replaceAll(finalMsg, 'panorama', panorama);
    finalMsg = replaceAll(finalMsg, 'trends', topTrends);
    finalMsg = replaceAll(finalMsg, 'highlights', highlights);
    finalMsg += `\n\n⏰ Horário da Análise: ${now.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;

    const currentStr = now.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
    const inWorkingHours = currentStr >= (settings.workStart || "10:00") && currentStr <= (settings.workEnd || "19:00");

    if (inWorkingHours) {
        try {
            await sendWebhookMessage(settings.webhookUrl, settings.phoneNumber, finalMsg);
            await (prisma as any).settings.update({
                where: { id: settings.id },
                data: { lastAlertHash: activeHash, lastAlertTime: now, lastAlertFullContent: finalMsg }
            });

            const currentHourSP = now.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', hour12: false }).split(':')[0];
            const msgLog = isFirstTime ? "🚀 Primeiro boletim enviado!" : isNewHour ? `🕘 Boletim das ${currentHourSP}h enviado.` : "🚀 Sinais detectados! Novo alerta enviado.";
            await (prisma as any).systemLog.create({ data: { message: msgLog, level: "success" } });
        } catch (e) {
            console.error("Falha ao enviar webhook", e);
            await (prisma as any).systemLog.create({ data: { message: "❌ Falha no disparador de Webhook.", level: "warning" } });
        }
    }
}
