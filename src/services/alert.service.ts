import prisma from '@/lib/prisma';
import { sendWebhookMessage } from '@/lib/webhook';
import { sendPushNotification } from '@/lib/onesignal';
import crypto from 'crypto';
import { StockAnalysis } from '@/lib/yahoo-finance';

export async function processAlerts(alerts: string[], suggestions: StockAnalysis[], settings: any, trending: StockAnalysis[] = [], allPortfolio: any[] = [], userId: string, userName: string = "Investidor", isTest: boolean = false, forceSend: boolean = false) {
    if (!settings?.webhookUrl || !settings?.phoneNumber || (!settings.autoAlerts && !isTest)) {
        return { status: "skipped", reason: "no_contact_or_auto_alerts_disabled" };
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

    // Regra: Respeitar o horário definido pelo usuário IMEDIATAMENTE.
    // REMOVIDO: Agora o horário é livre, controlado pelo Admin na interface.
    const inWorkingHours = true;

    if (!isTest && !inWorkingHours) {
        return { status: "skipped", reason: "out_of_working_hours" };
    }

    const lastAlertTime = settings.lastAlertTime ? new Date(settings.lastAlertTime) : null;
    const isFirstTime = !lastAlertTime;

    const currentHourStart = new Date(now);
    currentHourStart.setMinutes(0, 0, 0);

    const lastAlertHourNormalized = lastAlertTime ? new Date(lastAlertTime) : null;
    if (lastAlertHourNormalized) {
        lastAlertHourNormalized.setMinutes(0, 0, 0);
    }
    const isNewHour = !lastAlertHourNormalized || currentHourStart.getTime() > lastAlertHourNormalized.getTime();

    const currentHourSP = now.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', hour12: false }).split(':')[0];
    const isIdleReportHour = ["11", "16"].includes(currentHourSP);

    // Regra: Somente nas horas cheias (minutos no inicio da hora) ou se for o primeiro
    const isHoraCheia = minutes <= 10; // Reduzido para 10 min de janela na hora cheia

    // Bypass rules for manual tests OR forced Cron jobs
    if (!isTest && !forceSend) {
        // Envidaremos se for a primeira vez OU se virou a hora e estamos na janela da hora cheia
        const shouldSend = isFirstTime || (isNewHour && isHoraCheia) || isChanged;

        if (!shouldSend) {
            return { status: "skipped", reason: "not_time_for_hourly_report" };
        }
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

    // Prefix the greeting
    finalMsg = `Olá, *${userName}*! 👋\n\n${finalMsg}`;

    if (!isChanged && !isFirstTime && isIdleReportHour && !isTest) {
        finalMsg = `💤 *BOLSA SEM NOVIDADES* 💤\n\n` +
            `O mercado está lateralizado ou parado no momento, mas o seu *RAPERStock* segue monitorando 24h por dia e trabalhando para você! 🚀\n\n` +
            finalMsg;
    }

    if (isTest) {
        finalMsg = `⚠️ *[TESTE DE DISPARO]* ⚠️\n\n${finalMsg}`;
    }

    finalMsg += `\n\n⏰ Horário da Análise: ${now.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;

    try {
        // Envios
        await sendWebhookMessage(settings.webhookUrl, settings.phoneNumber, finalMsg);

        // Prepare Push Notification Content from Templates
        let pushTitle = settings.pushTitle || "Alerta RAPERStock";
        let pushMsg = settings.pushMessage || "Tem movimentação na sua carteira!";

        const alertsCount = alerts.length.toString();
        const replacePushVars = (str: string) => str.split('{{alerts_count}}').join(alertsCount);

        pushTitle = replacePushVars(pushTitle);
        pushMsg = replacePushVars(pushMsg);

        // Fallback for tests or specific states if not using variables
        if (isTest) {
            pushTitle = settings.pushTestTitle || "Teste de Integração";
            pushMsg = settings.pushTestMessage || "Push Notification recebida com sucesso!";
        }

        // Dispatch Push Notification
        if (userId) {
            await sendPushNotification(pushTitle, pushMsg, [userId]);
        }


        // Don't update hash/time for tests to keep them independent
        if (!isTest) {
            await prisma.settings.update({
                where: { id: settings.id },
                data: { lastAlertHash: activeHash, lastAlertTime: now, lastAlertFullContent: finalMsg }
            });

            const currentHourSP = now.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', hour12: false }).split(':')[0];
            const msgLog = isFirstTime ? "🚀 Primeiro boletim enviado!" : isNewHour ? `🕘 Boletim das ${currentHourSP}h enviado.` : "🚀 Sinais detectados! Novo alerta enviado.";
            await prisma.systemLog.create({ data: { userId, message: msgLog, level: "success" } });
        } else {
            await prisma.systemLog.create({
                data: {
                    userId,
                    message: "🧪 Disparo de teste manual enviado com sucesso.",
                    level: "info"
                }
            });
        }
        return { status: "sent", reason: isTest ? "test" : (isFirstTime ? "first_time" : isNewHour ? "new_hour_report" : "signals_changed") };
    } catch (e) {
        console.error("Falha ao enviar webhook", e);
        await prisma.systemLog.create({ data: { userId, message: "❌ Falha no disparador de Webhook.", level: "warning" } });
        return { status: "failed", reason: "webhook_error", error: String(e) };
    }
}
