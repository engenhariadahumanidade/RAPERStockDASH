import { NextResponse } from 'next/server';
import { runDashboardAnalysis } from '@/services/dashboard.service';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const triggerAlert = searchParams.get('triggerAlert') === 'true';

        const dashboardData = await runDashboardAnalysis(triggerAlert);

        return NextResponse.json(dashboardData);

    } catch (error) {
        return NextResponse.json({ error: 'Erro ao analisar dashboard', details: String(error) }, { status: 500 });
    }
}
