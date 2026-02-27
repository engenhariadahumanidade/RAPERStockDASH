import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    // Chamamos a mesma lógica do dashboard, mas forçando o disparo do alerta
    const baseUrl = new URL(request.url).origin;

    try {
        const res = await fetch(`${baseUrl}/api/dashboard?triggerAlert=true`, {
            headers: {
                'x-vercel-cron': 'true' // Identificador opcional para logs
            }
        });

        const data = await res.json();
        return NextResponse.json({
            success: true,
            message: 'Cron executado com sucesso',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: String(error)
        }, { status: 500 });
    }
}
