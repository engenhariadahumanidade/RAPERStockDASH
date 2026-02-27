import { NextResponse } from 'next/server';
import { runDashboardAnalysis } from '@/services/dashboard.service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        // Executamos a análise e o disparo de alertas diretamente via Service
        // O parâmetro 'true' força o processamento dos alertas
        await runDashboardAnalysis(true);

        return NextResponse.json({
            success: true,
            message: 'Análise agendada executada com sucesso',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: String(error)
        }, { status: 500 });
    }
}
