import { NextResponse } from 'next/server';
import { sendWebhookMessage } from '@/lib/webhook';
import prisma from '@/lib/prisma';

export async function POST() {
    try {
        const settings = await prisma.settings.findFirst();

        if (!settings || !settings.webhookUrl || !settings.phoneNumber) {
            return NextResponse.json(
                { error: 'Webhook URL e número de telefone devem estar configurados.' },
                { status: 400 }
            );
        }

        const testMsg = "🚀 Olá! Este é um teste da sua Master Dashboard Financeira. O Webhook está configurado e funcionando perfeitamente! 📈💰";

        const response = await sendWebhookMessage(settings.webhookUrl, settings.phoneNumber, testMsg);

        return NextResponse.json({ success: true, apiResponse: response });
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Falha ao enviar mensagem pelo webhook.', details: error.message },
            { status: 500 }
        );
    }
}
