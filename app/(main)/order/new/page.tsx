'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface OrderItem {
  sku: string;
  quantity: number;
}

interface FormErrors {
  sku?: string;
  quantity?: string;
}

export default function NewOrderPage() {
  const [item, setItem] = useState<OrderItem>({ sku: '', quantity: 1 });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: FormErrors = {};
    let isValid = true;

    if (!item.sku.trim()) {
      newErrors.sku = 'SKU is required';
      isValid = false;
    }

    if (!item.quantity || item.quantity < 1) {
      newErrors.quantity = 'Quantity must be at least 1';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [item] })
      });

      if (!response.ok) throw new Error('Failed to create order');

      toast({
        title: 'Success',
        description: 'Order created successfully'
      });

      // Reset form
      setItem({ sku: '', quantity: 1 });
      setErrors({});
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create order',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='container max-w-2xl mx-auto py-6'>
      <Card>
        <CardHeader>
          <CardTitle>Create New Order</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='grid gap-4 p-4 border rounded-lg bg-slate-50'>
              <div className='grid gap-2'>
                <label className='text-sm font-medium'>SKU</label>
                <Input
                  placeholder='Enter SKU'
                  value={item.sku}
                  onChange={(e) => setItem({ ...item, sku: e.target.value })}
                  className={errors.sku ? 'border-red-500' : ''}
                />
                {errors.sku && (
                  <span className='text-sm text-red-500'>{errors.sku}</span>
                )}
              </div>

              <div className='grid gap-2'>
                <label className='text-sm font-medium'>Quantity</label>
                <Input
                  type='number'
                  min='1'
                  value={item.quantity}
                  onChange={(e) =>
                    setItem({
                      ...item,
                      quantity: parseInt(e.target.value) || 0
                    })
                  }
                  className={errors.quantity ? 'border-red-500' : ''}
                />
                {errors.quantity && (
                  <span className='text-sm text-red-500'>
                    {errors.quantity}
                  </span>
                )}
              </div>
            </div>

            <Button type='submit' disabled={isSubmitting} className='w-full'>
              {isSubmitting ? 'Creating Order...' : 'Create Order'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
