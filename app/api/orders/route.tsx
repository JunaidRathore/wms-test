// app/api/orders/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { items } = await request.json();

    // First, let's find the item using SKU
    const itemPromises = items.map(
      async (orderItem: { sku: string; quantity: number }) => {
        const item = await prisma.item.findFirst({
          where: { sku: orderItem.sku }
        });

        if (!item) {
          throw new Error(`Item with SKU ${orderItem.sku} not found`);
        }

        return {
          itemId: item.id,
          quantity: orderItem.quantity
        };
      }
    );

    const resolvedItems = await Promise.all(itemPromises);

    // Get first company (for testing purposes - you should get this from user session)
    const company = await prisma.user.findFirst({
      select: {
        companyId: true
      }
    });

    if (!company?.companyId) {
      throw new Error('No company found');
    }

    // Get first user (for testing purposes - you should get this from user session)
    const user = await prisma.user.findFirst();

    if (!user) {
      throw new Error('No user found');
    }

    // Create the order
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD${Date.now()}`,
        companyId: company.companyId,
        createdById: user.id,
        orderItems: {
          create: resolvedItems
        }
      },
      include: {
        orderItems: {
          include: {
            item: true
          }
        }
      }
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error('Failed to create order:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create order'
      },
      { status: 500 }
    );
  }
}
