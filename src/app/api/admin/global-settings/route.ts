import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const dbUser = await prisma.user.findUnique({ where: { id: userId } });
        const isMasterAdmin = dbUser?.email.toLowerCase() === "engenhariadahumanidade@gmail.com" || dbUser?.email === process.env.ADMIN_EMAIL;
        if (!dbUser?.isAdmin && !isMasterAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        let settings = await prisma.settings.findFirst();
        return NextResponse.json({
            webhookUrl: settings?.webhookUrl || '',
            scanInterval: settings?.scanInterval || 15,
            workStart: settings?.workStart || '10:00',
            workEnd: settings?.workEnd || '19:00',
            masterSwitch: settings?.masterSwitch ?? true,
            pushTitle: settings?.pushTitle || "Alerta RAPERStock",
            pushMessage: settings?.pushMessage || "Tem movimentação na sua carteira!",
            pushTestTitle: settings?.pushTestTitle || "Teste de Integração",
            pushTestMessage: settings?.pushTestMessage || "Push Notification recebida com sucesso!",
            customMessage: settings?.customMessage || "🕘 *BOLETIM DE MERCADO* 🕘\n\n📊 *PANORAMA GERAL:*\n{{panorama}}\n\n📈 *TENDÊNCIAS QUENTES:*\n{{trends}}\n\n💼 *DESTAQUES CARTEIRA:*\n{{highlights}}\n\n🚨 *SINAIS/ALERTAS:*\n{{alerts}}\n\n💡 *DICAS DO SCANNER:*\n{{suggestions}}\n\n⚠️ *ATENÇÃO:* Evite entradas pesadas sem confirmação.",
        });
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao carregar configurações globais' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const dbUser = await prisma.user.findUnique({ where: { id: userId } });
        const isMasterAdmin = dbUser?.email.toLowerCase() === "engenhariadahumanidade@gmail.com" || dbUser?.email === process.env.ADMIN_EMAIL;
        if (!dbUser?.isAdmin && !isMasterAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { webhookUrl, scanInterval, customMessage, workStart, workEnd, masterSwitch, pushTitle, pushMessage, pushTestTitle, pushTestMessage } = await request.json();

        // Update ALL settings
        await prisma.settings.updateMany({
            data: {
                webhookUrl,
                scanInterval,
                customMessage,
                workStart,
                workEnd,
                masterSwitch,
                pushTitle,
                pushMessage,
                pushTestTitle,
                pushTestMessage
            }
        });

        return NextResponse.json({ success: true, webhookUrl, scanInterval, customMessage, workStart, workEnd, masterSwitch, pushTitle, pushMessage, pushTestTitle, pushTestMessage });
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao salvar configurações globais' }, { status: 500 });
    }
}
