// components/orders/StatusDropdown.tsx
'use client';

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

type OrderStatus = 'PENDING' | 'PICKING' | 'COMPLETED' | 'CANCELLED';

interface StatusDropdownProps {
  orderId: string;
  currentStatus: OrderStatus;
  onStatusChange: (newStatus: OrderStatus) => void;
}

export function StatusDropdown({
  orderId,
  currentStatus,
  onStatusChange
}: StatusDropdownProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    setIsUpdating(true);

    // Optimistically update the UI
    onStatusChange(newStatus);

    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        // Revert optimistic update on error
        onStatusChange(currentStatus);
        throw new Error('Failed to update status');
      }

      toast({
        title: 'Status updated',
        description: `Order status changed to ${newStatus}`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Select
      disabled={isUpdating}
      value={currentStatus}
      onValueChange={(value: OrderStatus) => handleStatusChange(value)}
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
  );
}
