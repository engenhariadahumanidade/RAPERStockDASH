import { NextResponse } from 'next/server';
import { runDashboardAnalysis } from '@/services/dashboard.service';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const usersToAlert = await prisma.settings.findMany({
            where: { autoAlerts: true },
            select: { userId: true }
        });

        const results = [];
        for (const user of usersToAlert) {
            try {
                await runDashboardAnalysis(user.userId, true);
                results.push({ userId: user.userId, status: 'success' });
            } catch (err) {
                console.error(`Error analyzing dashboard for user ${user.userId}:`, err);
                results.push({ userId: user.userId, status: 'error', error: String(err) });
            }
        }

        return NextResponse.json({
            success: true,
            message: `Análise executada para ${usersToAlert.length} usuários.`,
            results,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: String(error)
        }, { status: 500 });
    }
}
