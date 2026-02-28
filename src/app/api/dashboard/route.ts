import { NextResponse } from 'next/server';
import { runDashboardAnalysis } from '@/services/dashboard.service';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const triggerAlert = searchParams.get('triggerAlert') === 'true';

        const dashboardData = await runDashboardAnalysis(userId, triggerAlert);

        return NextResponse.json(dashboardData);

    } catch (error) {
        return NextResponse.json({ error: 'Erro ao analisar dashboard', details: String(error) }, { status: 500 });
    }
}
