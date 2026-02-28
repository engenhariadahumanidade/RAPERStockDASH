import { NextResponse } from 'next/server';
import { runDashboardAnalysis } from '@/services/dashboard.service';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Verify if user is admin
        const dbUser = await prisma.user.findUnique({ where: { id: userId } });
        const isMasterAdmin = dbUser?.email.toLowerCase() === "engenhariadahumanidade@gmail.com" || dbUser?.email === process.env.ADMIN_EMAIL;
        if (!dbUser?.isAdmin && !isMasterAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 1. Get real data using the logic from dashboard service
        // This will fetch suggestions, trending, portfolio and apply current template
        const data = await runDashboardAnalysis(userId, false);

        // 2. We need the settings to get the webhook and the template
        const settings = await prisma.settings.findUnique({ where: { userId } });
        if (!settings || !settings.webhookUrl || !settings.phoneNumber) {
            return NextResponse.json(
                { error: 'Configurações de Webhook ou Telefone não encontradas para o seu usuário admin.' },
                { status: 400 }
            );
        }

        // 3. Trigger the actual alert process but with the admin's context
        // Instead of calling processAlerts manually (which might have deduplication logic),
        // we call runDashboardAnalysis with triggerAlert=true which handles everything integrated.
        // This ensures the template is processed with REAL CURRENT data.

        await runDashboardAnalysis(userId, true);

        return NextResponse.json({
            success: true,
            message: 'Disparo de teste (com dados reais) enviado para o seu WhatsApp configurado.'
        });

    } catch (error: any) {
        console.error("Test Webhook Error:", error);
        return NextResponse.json(
            { error: 'Falha ao processar disparo de teste.', details: error.message },
            { status: 500 }
        );
    }
}
