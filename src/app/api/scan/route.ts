import { NextResponse } from 'next/server';
import { runDashboardAnalysis } from '@/services/dashboard.service';
import prisma from '@/lib/prisma';
import { sendWebhookMessage } from '@/lib/webhook';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Global lock to prevent concurrent scans across requests
let lastScanTime: number | null = null;
const MIN_SCAN_INTERVAL_MS = 90_000; // 90 seconds minimum between scans

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        // Verify user exists
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 });
        }

        // Obter as configurações globais (usando as do admin como referência)
        const adminSettings = await prisma.settings.findFirst({
            where: { user: { isAdmin: true } },
        });

        if (adminSettings && adminSettings.masterSwitch === false) {
            return NextResponse.json({
                triggered: false,
                reason: 'master_switch_off',
                message: 'O Motor Principal está DESLIGADO na área Admin.',
                nextCheck: MIN_SCAN_INTERVAL_MS
            });
        }

        // Check working hours (São Paulo timezone)
        const now = new Date();
        const spTime = now.toLocaleTimeString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        const workStart = adminSettings?.workStart || "10:00";
        const workEnd = adminSettings?.workEnd || "19:00";

        if (spTime < workStart || spTime > workEnd) {
            return NextResponse.json({
                triggered: false,
                reason: 'fora_do_horario',
                message: `Fora do horário de operação (${spTime}). O scanner está operando de ${workStart} às ${workEnd}.`,
                nextCheck: MIN_SCAN_INTERVAL_MS
            });
        }

        // Prevent concurrent/duplicate scans
        const currentTime = Date.now();
        if (lastScanTime && (currentTime - lastScanTime) < MIN_SCAN_INTERVAL_MS) {
            const waitSeconds = Math.ceil((MIN_SCAN_INTERVAL_MS - (currentTime - lastScanTime)) / 1000);
            return NextResponse.json({
                triggered: false,
                reason: 'scan_recente',
                message: `Última varredura foi há menos de ${Math.ceil(MIN_SCAN_INTERVAL_MS / 1000)}s. Próxima em ~${waitSeconds}s.`,
                nextCheck: MIN_SCAN_INTERVAL_MS
            });
        }

        // Also check database for last scan to handle multi-instance serverless
        const lastScanLog = await prisma.systemLog.findFirst({
            where: {
                message: { contains: 'Varredura automática via interface' }
            },
            orderBy: { createdAt: 'desc' }
        });

        if (lastScanLog) {
            const dbTimeDiff = currentTime - new Date(lastScanLog.createdAt).getTime();
            if (dbTimeDiff < MIN_SCAN_INTERVAL_MS) {
                return NextResponse.json({
                    triggered: false,
                    reason: 'scan_recente_db',
                    message: `Varredura recente detectada (há ${Math.ceil(dbTimeDiff / 1000)}s). Aguardando intervalo mínimo.`,
                    nextCheck: MIN_SCAN_INTERVAL_MS
                });
            }
        }

        // Lock the scan
        lastScanTime = currentTime;

        // Run scan for ALL users with autoAlerts enabled
        const usersToAlert = await prisma.settings.findMany({
            where: { autoAlerts: true },
            select: { userId: true },
        });

        const stats = {
            totalUsersChecked: usersToAlert.length,
            messagesSentTotal: 0,
            skippedTotal: 0,
            errors: 0
        };

        for (const u of usersToAlert) {
            try {
                const result = await runDashboardAnalysis(u.userId, true);
                const alertStatus = result.alertStatus;

                if (alertStatus?.status === 'sent') {
                    stats.messagesSentTotal++;
                } else if (alertStatus?.status === 'skipped') {
                    stats.skippedTotal++;
                } else if (alertStatus?.status === 'failed') {
                    stats.errors++;
                }
            } catch (err) {
                console.error(`[Scan] Erro ao processar usuário ${u.userId}:`, err);
                stats.errors++;
            }
        }

        // Log the scan execution
        await prisma.systemLog.create({
            data: {
                userId,
                message: `🔄 Varredura automática via interface — ${stats.messagesSentTotal} enviadas, ${stats.skippedTotal} retidas, ${stats.errors} erros.`,
                level: stats.errors > 0 ? 'warning' : 'info'
            }
        });

        // Send admin report if messages were sent
        if (stats.messagesSentTotal > 0) {
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
                    const spNow = now.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' });
                    const reportMsg = `🔄 *VARREDURA VIA INTERFACE* 🔄\n\n` +
                        `⏰ Horário: ${spNow}\n` +
                        `👤 Disparada por: ${user.email}\n` +
                        `👥 Usuários verificados: ${stats.totalUsersChecked}\n` +
                        `✅ Mensagens enviadas: ${stats.messagesSentTotal}\n` +
                        `⏳ Retidas: ${stats.skippedTotal}\n` +
                        (stats.errors > 0 ? `🚨 Erros: ${stats.errors}\n` : '');

                    await sendWebhookMessage(adminUser.settings.webhookUrl, adminUser.settings.phoneNumber, reportMsg);
                }
            } catch (adminErr) {
                console.error('[Scan] Erro ao enviar relatório admin:', adminErr);
            }
        }

        // Get the configured scan interval
        const scanIntervalMs = ((adminSettings?.scanInterval || 15) * 60 * 1000);

        return NextResponse.json({
            triggered: true,
            stats,
            nextCheck: scanIntervalMs,
            timestamp: now.toISOString()
        });

    } catch (error: any) {
        console.error('[Scan] Erro geral:', error);
        return NextResponse.json({
            triggered: false,
            reason: 'erro_interno',
            error: error.message
        }, { status: 500 });
    }
}
