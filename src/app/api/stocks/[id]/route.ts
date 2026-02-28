import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

import { auth } from '@clerk/nextjs/server';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await context.params;
        const { symbol, quantity, averagePrice } = await request.json();

        // Ensure user owns stock
        const stockExists = await prisma.stock.findUnique({ where: { id: Number(id) } });
        if (!stockExists || stockExists.userId !== userId) {
            return NextResponse.json({ error: 'Not found or forbidden' }, { status: 403 });
        }

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
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await context.params;

        const stockExists = await prisma.stock.findUnique({ where: { id: Number(id) } });
        if (!stockExists || stockExists.userId !== userId) {
            return NextResponse.json({ error: 'Not found or forbidden' }, { status: 403 });
        }

        const stock = await prisma.stock.delete({
            where: { id: Number(id) },
        });
        return NextResponse.json(stock);
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao deletar ação' }, { status: 500 });
    }
}
