import { NextResponse } from 'next/server';
import { runDashboardAnalysis } from '@/services/dashboard.service';
import prisma from '@/lib/prisma';
import { sendWebhookMessage } from '@/lib/webhook';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const usersToAlert = await prisma.settings.findMany({
            where: { autoAlerts: true },
            select: { userId: true },
        });

        const results = [];
        const stats = {
            totalUsersChecked: usersToAlert.length,
            messagesSentTotal: 0,
            messagesSentReasons: {} as Record<string, number>,
            skippedTotal: 0,
            skippedReasons: {} as Record<string, number>,
            errors: 0
        };

        const reasonMap: Record<string, string> = {
            "no_contact_or_auto_alerts_disabled": "Sem contato ou alertas desativados",
            "duplicate_prevention_120s": "Prevenção de duplicidade (<2min)",
            "postponed_to_next_hour": "Postergado para a próxima hora cheia",
            "no_changes_and_not_report_hour": "Sem movimento (mantido)",
            "out_of_working_hours": "Fora do horário de operação",
            "test": "Disparo de teste",
            "first_time": "Primeiro envio",
            "new_hour_report": "Boletim da hora (sem alteração)",
            "signals_changed": "Novos sinais de radar",
            "webhook_error": "Erro no webhook"
        };

        for (const user of usersToAlert) {
            try {
                const analysisResult = await runDashboardAnalysis(user.userId, true);

                const alertStatus = analysisResult.alertStatus;

                if (alertStatus) {
                    const mappedReason = alertStatus.reason ? (reasonMap[alertStatus.reason] || alertStatus.reason) : "Desconhecido";
                    if (alertStatus.status === "sent") {
                        stats.messagesSentTotal++;
                        stats.messagesSentReasons[mappedReason] = (stats.messagesSentReasons[mappedReason] || 0) + 1;
                    } else if (alertStatus.status === "skipped") {
                        stats.skippedTotal++;
                        stats.skippedReasons[mappedReason] = (stats.skippedReasons[mappedReason] || 0) + 1;
                    } else if (alertStatus.status === "failed") {
                        stats.errors++;
                    }
                } else {
                    stats.skippedTotal++;
                    stats.skippedReasons["Desconhecido"] = (stats.skippedReasons["Desconhecido"] || 0) + 1;
                }

                results.push({ userId: user.userId, status: 'success', alertStatus });
            } catch (err: any) {
                console.error(`Error analyzing dashboard for user ${user.userId}:`, err);
                stats.errors++;
                results.push({ userId: user.userId, status: 'error', error: String(err) });
            }
        }

        // Envia relatório agregado consolidado para o Administrador (Engenharia da Humanidade)
        try {
            const adminUser = await prisma.user.findFirst({
                where: {
                    OR: [
                        { email: "engenhariadahumanidade@gmail.com" },
                        { isAdmin: true }
                    ]
                },
                include: { settings: true },
                orderBy: { createdAt: 'asc' }
            });

            if (adminUser?.settings?.webhookUrl && adminUser?.settings?.phoneNumber) {
                const now = new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' });

                let reportMsg = `🛠️ *RELATÓRIO DO SISTEMA RAPERStock* 🛠️\n\n` +
                    `⏰ Horário da Execução: ${now}\n` +
                    `👥 Usuários Verificados: ${stats.totalUsersChecked}\n\n`;

                reportMsg += `✅ *Mensagens Enviadas: ${stats.messagesSentTotal}*\n`;
                if (stats.messagesSentTotal > 0) {
                    reportMsg += Object.entries(stats.messagesSentReasons).map(([r, c]) => `   - ${r}: ${c}`).join('\n') + `\n\n`;
                } else {
                    reportMsg += `   Nenhuma mensagem enviada nesta rodada.\n\n`;
                }

                reportMsg += `⏳ *Mensagens Retidas (Trabalho Invisível): ${stats.skippedTotal}*\n`;
                if (stats.skippedTotal > 0) {
                    reportMsg += Object.entries(stats.skippedReasons).map(([r, c]) => `   - ${r}: ${c}`).join('\n') + `\n\n`;
                } else {
                    reportMsg += `   Nenhuma.\n\n`;
                }

                if (stats.errors > 0) {
                    reportMsg += `🚨 *Erros de Processamento: ${stats.errors}*\n\n`;
                }

                reportMsg += `O sistema continua operando as varreduras de mercado silenciosamente nos bastidores.`;

                await sendWebhookMessage(adminUser.settings.webhookUrl, adminUser.settings.phoneNumber, reportMsg);
            }
        } catch (adminErr) {
            console.error("Falha ao enviar relatorio de admin:", adminErr);
        }

        return NextResponse.json({
            success: true,
            message: `Análise executada para ${usersToAlert.length} usuários.`,
            stats,
            results,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: String(error)
        }, { status: 500 });
    }
}
