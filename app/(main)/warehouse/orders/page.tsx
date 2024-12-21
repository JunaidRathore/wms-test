import { OrderList } from '@/components/warehouse/orders/OrderList';
import { prisma } from '@/lib/db';

export default async function WarehouseOrdersPage() {
  // Get pending orders with FIFO pick locations
  const orders = await prisma.order.findMany({
    where: { status: 'PENDING' },
    include: {
      orderItems: {
        include: {
          item: true
        }
      },
      createdBy: {
        select: {
          username: true
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  // For each order item, determine the FIFO pick location
  const ordersWithLocations = await Promise.all(
    orders.map(async (order: any) => {
      const itemsWithLocations = await Promise.all(
        order.orderItems.map(async (orderItem: any) => {
          // Get the oldest stock locations for this item
          const oldestStock = await prisma.transaction.findMany({
            where: {
              itemId: orderItem.itemId,
              type: 'ADD',
              status: 'COMPLETED'
            },
            include: {
              toLocation: true
            },
            orderBy: {
              createdAt: 'asc'
            }
          });

          return {
            ...orderItem,
            pickLocation: oldestStock[0]?.toLocation?.label || 'No stock found'
          };
        })
      );

      return {
        ...order,
        orderItems: itemsWithLocations
      };
    })
  );

  return (
    <div className='container mx-auto p-6'>
      <h1 className='text-2xl font-bold mb-4'>Pending Orders for Picking</h1>
      <OrderList initialOrders={ordersWithLocations} />
    </div>
  );
}
