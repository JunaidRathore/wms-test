// app/api/orders/[orderId]/items/[itemId]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: { orderId: string; itemId: string } }
) {
  try {
    const { status } = await request.json();
    const { itemId } = params;

    const updatedItem = await prisma.orderItem.update({
      where: { id: itemId },
      data: { status }
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update item status' },
      { status: 500 }
    );
  }
}
