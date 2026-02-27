import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const { symbol, quantity, averagePrice } = await request.json();
        const stock = await prisma.stock.update({
            where: { id: Number(id) },
            data: {
                symbol: symbol.toUpperCase(),
                quantity: parseFloat(quantity),
                averagePrice: parseFloat(averagePrice),
            },
        });
        return NextResponse.json(stock);
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao atualizar ação' }, { status: 500 });
    }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const stock = await prisma.stock.delete({
            where: { id: Number(id) },
        });
        return NextResponse.json(stock);
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao deletar ação' }, { status: 500 });
    }
}
