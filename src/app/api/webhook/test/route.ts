import { NextResponse } from 'next/server';
import { sendWebhookMessage } from '@/lib/webhook';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const forceLastBulletin = searchParams.get('forceLastBulletin') === 'true';

        const settings = await prisma.settings.findFirst();

        if (!settings || !settings.webhookUrl || !settings.phoneNumber) {
            return NextResponse.json(
                { error: 'Webhook URL e número de telefone devem estar configurados.' },
                { status: 400 }
            );
        }

        let testMsg = settings.customMessage || "Sinais:\n{{alerts}}\n\nDicas:\n{{suggestions}}";

        if (forceLastBulletin && (settings as any).lastAlertFullContent) {
            testMsg = (settings as any).lastAlertFullContent;
        }

        const response = await sendWebhookMessage(settings.webhookUrl, settings.phoneNumber, testMsg);

        return NextResponse.json({ success: true, apiResponse: response });
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Falha ao enviar mensagem pelo webhook.', details: error.message },
            { status: 500 }
        );
    }
}
