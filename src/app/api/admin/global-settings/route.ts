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
            scanInterval: settings?.scanInterval || 15
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

        const { webhookUrl, scanInterval } = await request.json();

        // Update ALL settings
        await prisma.settings.updateMany({
            data: { webhookUrl, scanInterval }
        });

        return NextResponse.json({ success: true, webhookUrl, scanInterval });
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao salvar configurações globais' }, { status: 500 });
    }
}
