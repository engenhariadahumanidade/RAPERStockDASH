import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

import { auth } from '@clerk/nextjs/server';

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        let settings = await prisma.settings.findUnique({ where: { userId } });
        if (!settings) {
            settings = await prisma.settings.create({
                data: {
                    userId,
                    webhookUrl: '',
                    phoneNumber: '',
                    autoAlerts: true,
                    customMessage: "🕘 *BOLETIM DE MERCADO* 🕘\n\n📊 *PANORAMA GERAL:*\n{{panorama}}\n\n📈 *TENDÊNCIAS QUENTES:*\n{{trends}}\n\n💼 *DESTAQUES CARTEIRA:*\n{{highlights}}\n\n🚨 *SINAIS/ALERTAS:*\n{{alerts}}\n\n💡 *DICAS DO SCANNER:*\n{{suggestions}}\n\n⚠️ *ATENÇÃO:* Evite entradas pesadas sem confirmação.",
                    scanInterval: 15,
                },
            });
        }
        return NextResponse.json(settings);
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao carregar configurações' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { webhookUrl, phoneNumber, autoAlerts, customMessage, scanInterval, workStart, workEnd } = await request.json();

        const settings = await prisma.settings.upsert({
            where: { userId },
            update: { webhookUrl, phoneNumber, autoAlerts, customMessage, scanInterval, workStart, workEnd },
            create: { userId, webhookUrl, phoneNumber, autoAlerts, customMessage, scanInterval, workStart, workEnd },
        });

        return NextResponse.json(settings);
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 });
    }
}
