import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        let settings = await prisma.settings.findFirst();
        if (!settings) {
            settings = await prisma.settings.create({
                data: {
                    webhookUrl: '',
                    phoneNumber: '',
                    autoAlerts: true,
                    customMessage: "🚨 *ALERTA DA CARTEIRA* 🚨\n\nIdentificamos os seguintes movimentos:\n\n{{alerts}}\n\n💡 *DICAS DE NOVAS AÇÕES* 💡\n{{suggestions}}",
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
        const { webhookUrl, phoneNumber, autoAlerts, customMessage, scanInterval, workStart, workEnd } = await request.json();
        let settings = await prisma.settings.findFirst();

        if (settings) {
            settings = await prisma.settings.update({
                where: { id: settings.id },
                data: { webhookUrl, phoneNumber, autoAlerts, customMessage, scanInterval, workStart, workEnd },
            });
        } else {
            settings = await prisma.settings.create({
                data: { webhookUrl, phoneNumber, autoAlerts, customMessage, scanInterval, workStart, workEnd },
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 });
    }
}
