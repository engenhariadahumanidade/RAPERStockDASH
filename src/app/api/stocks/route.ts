import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const stocks = await prisma.stock.findMany();
        return NextResponse.json(stocks);
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao buscar ações' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { symbol, quantity, averagePrice } = await request.json();
        const stock = await prisma.stock.create({
            data: {
                symbol: symbol.toUpperCase(),
                quantity: parseFloat(quantity),
                averagePrice: parseFloat(averagePrice),
            },
        });
        return NextResponse.json(stock);
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao criar ação' }, { status: 500 });
    }
}
