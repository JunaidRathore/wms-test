'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

type OrderStatus = 'PENDING' | 'PICKING' | 'COMPLETED' | 'CANCELLED';

interface Item {
  id: string;
  sku: string;
  name: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  pickLocation: string | null;
  item: Item;
}

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  orderItems: OrderItem[];
}

interface OrderListProps {
  initialOrders: Order[];
}

export function OrderList({ initialOrders }: OrderListProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const handleStatusChange = async (
    orderId: string,
    newStatus: OrderStatus
  ) => {
    setUpdatingStatus(orderId);

    // Optimistically update UI
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );

    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      const updatedOrder = await response.json();

      // Make sure we preserve the nested item data
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                ...updatedOrder,
                orderItems: updatedOrder.orderItems.map((item: OrderItem) => ({
                  ...item,
                  item: item.item // Preserve the nested item data
                }))
              }
            : order
        )
      );

      toast({
        title: 'Success',
        description: `Order status updated to ${newStatus}`
      });
    } catch (error) {
      // Revert optimistic update
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId ? { ...order, status: order.status } : order
        )
      );

      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive'
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order #</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead>Pick Location</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <>
            {order.orderItems.map((item: OrderItem, index: number) => (
              <TableRow key={`${order.id}-${item.id}`}>
                {index === 0 && (
                  <>
                    <TableCell rowSpan={order.orderItems.length}>
                      {order.orderNumber}
                    </TableCell>
                    <TableCell rowSpan={order.orderItems.length}>
                      {format(new Date(order.createdAt), 'PPp')}
                    </TableCell>
                    <TableCell rowSpan={order.orderItems.length}>
                      <Select
                        disabled={updatingStatus === order.id}
                        value={order.status}
                        onValueChange={(value: OrderStatus) =>
                          handleStatusChange(order.id, value)
                        }
                      >
                        <SelectTrigger className='w-[180px]'>
                          <SelectValue placeholder='Select status' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='PENDING'>Pending</SelectItem>
                          <SelectItem value='PICKING'>Picking</SelectItem>
                          <SelectItem value='COMPLETED'>Completed</SelectItem>
                          <SelectItem value='CANCELLED'>Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </>
                )}
                <TableCell>{item.item?.sku || '-'}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{item.pickLocation || '-'}</TableCell>
                <TableCell>
                  {order.status === 'PENDING' && (
                    <Button
                      variant='secondary'
                      size='sm'
                      onClick={() => handleStatusChange(order.id, 'PICKING')}
                    >
                      Need to Pick
                    </Button>
                  )}

                  {order.status === 'PICKING' && (
                    <Button
                      variant='secondary'
                      size='sm'
                      onClick={() => handleStatusChange(order.id, 'COMPLETED')}
                    >
                      About to Pick
                    </Button>
                  )}

                  {order.status === 'COMPLETED' && (
                    <span className='text-green-600 font-medium'>
                      Order Completed
                    </span>
                  )}

                  {order.status === 'CANCELLED' && (
                    <span className='text-red-600 font-medium'>
                      Order Cancelled
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </>
        ))}
      </TableBody>
    </Table>
  );
}
