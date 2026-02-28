import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

import { auth } from '@clerk/nextjs/server';

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const stocks = await prisma.stock.findMany({ where: { userId } });
        return NextResponse.json(stocks);
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao buscar ações' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { symbol, quantity, averagePrice } = await request.json();
        const stock = await prisma.stock.create({
            data: {
                symbol: symbol.toUpperCase(),
                quantity: parseFloat(quantity),
                averagePrice: parseFloat(averagePrice),
                userId
            },
        });
        return NextResponse.json(stock);
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao criar ação' }, { status: 500 });
    }
}
