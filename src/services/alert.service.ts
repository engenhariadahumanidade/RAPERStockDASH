import prisma from '@/lib/prisma';
import { sendWebhookMessage } from '@/lib/webhook';
import crypto from 'crypto';
import { StockAnalysis } from '@/lib/yahoo-finance';

export async function processAlerts(alerts: string[], suggestions: StockAnalysis[], settings: any) {
    if (!settings?.webhookUrl || !settings?.phoneNumber || !settings.autoAlerts) {
        return;
    }

    const msgTemplate = settings.customMessage || "Sinais:\n{{alerts}}\n\nDicas:\n{{suggestions}}";

    const alertsText = alerts.join('\n');
    let suggestionsText = '';

    if (suggestions.length > 0) {
        suggestions.forEach((s: any) => {
            suggestionsText += `• [${s.symbol}] - Motivo: ${s.reason} \n  (Preço: R$ ${s.price.toFixed(2).replace('.', ',')})\n`;
        });
    } else {
        suggestionsText = 'Nenhuma grande oportunidade no momento.';
    }

    let finalMsg = msgTemplate
        .replace('{{alerts}}', alertsText)
        .replace('{{suggestions}}', suggestionsText);

    // Add time mark
    finalMsg += `\n\n⏰ Horário da Análise: ${new Date().toLocaleTimeString('pt-BR')}`;

    // Calculate hash of the core content (without the timestamp)
    const contentForHash = alertsText + suggestionsText;
    const activeHash = crypto.createHash('md5').update(contentForHash).digest('hex');

    const now = new Date();

    // Check for "On the Hour" transition
    const currentHourStart = new Date(now);
    currentHourStart.setMinutes(0, 0, 0);

    const lastAlertHourStart = settings.lastAlertTime ? new Date(settings.lastAlertTime) : null;
    if (lastAlertHourStart) {
        lastAlertHourStart.setMinutes(0, 0, 0);
    }

    const isFirstTime = !settings.lastAlertTime;
    const isChanged = settings.lastAlertHash !== activeHash;
    const isNewHour = !lastAlertHourStart || currentHourStart.getTime() > lastAlertHourStart.getTime();

    const currentStr = now.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });

    const wStart = settings.workStart || "10:00";
    const wEnd = settings.workEnd || "19:00";

    const inWorkingHours = currentStr >= wStart && currentStr <= wEnd;

    if (inWorkingHours) {
        if (isFirstTime || isChanged || isNewHour) {
            try {
                await sendWebhookMessage(settings.webhookUrl, settings.phoneNumber, finalMsg);

                await (prisma as any).settings.update({
                    where: { id: settings.id },
                    data: { lastAlertHash: activeHash, lastAlertTime: now }
                });

                let msgLog = "🚀 Alerta dinâmico enviado!";
                if (isFirstTime) {
                    msgLog = "🚀 Primeiro boletim executado e enviado!";
                } else if (isNewHour && !isChanged) {
                    msgLog = `🕘 Boletim das ${now.getHours()}h enviado (Resumo de hora em hora).`;
                } else if (isChanged) {
                    msgLog = `🚀 Sinais detectados! Novo alerta enviado para (${settings.phoneNumber}).`;
                }

                await (prisma as any).systemLog.create({
                    data: {
                        message: msgLog,
                        level: "success"
                    }
                });
            } catch (e) {
                console.error("Falha ao enviar webhook", e);
                await (prisma as any).systemLog.create({
                    data: {
                        message: "❌ Falha ao tentar disparar a mensagem para a URL de Webhook configurada.",
                        level: "warning"
                    }
                });
            }
        } else {
            // No changes and not a new hour yet
            // We can optionally keep a "Scan complete" log, or keep it quiet
            await (prisma as any).systemLog.create({
                data: {
                    message: "✅ Varredura concluída. Sem sinais novos. Aguardando a próxima hora cheia.",
                    level: "info"
                }
            });
        }
    } else {
        // Option 3: Ignore (No log outside working hours)
    }
}
