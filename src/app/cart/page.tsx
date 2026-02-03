"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, ShoppingCart, Trash2 } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import type { CartItem } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: CartItem;
  onUpdateQuantity: (mealId: string, quantity: number) => void;
  onRemove: (mealId: string) => void;
}) {
  const subtotal = (item.price ?? 0) * item.quantity;
  return (
    <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
          {item.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.image}
              alt={item.name ?? "Meal"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ShoppingCart className="size-8" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-medium truncate">{item.name ?? "Meal"}</p>
          <p className="text-sm text-muted-foreground">
            ৳{(item.price ?? 0).toFixed(2)} each
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-1 rounded-md border">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onUpdateQuantity(item.mealId, item.quantity - 1)}
            disabled={item.quantity <= 1}
            aria-label="Decrease quantity"
          >
            <Minus className="size-4" />
          </Button>
          <span className="min-w-8 text-center text-sm font-medium">
            {item.quantity}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onUpdateQuantity(item.mealId, item.quantity + 1)}
            aria-label="Increase quantity"
          >
            <Plus className="size-4" />
          </Button>
        </div>
        <p className="w-20 text-right font-semibold sm:w-24">
          ৳{subtotal.toFixed(2)}
        </p>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onRemove(item.mealId)}
          aria-label="Remove from cart"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalItems, totalAmount } =
    useCart();

  const byProvider = useMemo(() => {
    const map = new Map<string | undefined, CartItem[]>();
    for (const item of items) {
      const key = item.providerProfileId ?? "unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries());
  }, [items]);

  const isEmpty = items.length === 0;
  const multipleProviders = byProvider.length > 1;

  if (isEmpty) {
    return (
      <div className="py-8 md:py-12">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Cart</h1>
          <p className="text-muted-foreground">Your cart is empty.</p>
        </div>
        <Card className="py-16">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <ShoppingBag className="size-16 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">No items in cart</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add meals from the menu to get started.
            </p>
            <Button asChild size="lg" className="mt-6">
              <Link href="/meals">Browse meals</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-8 md:py-12">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Cart</h1>
        <p className="text-muted-foreground">
          {totalItems} item{totalItems !== 1 ? "s" : ""} in your cart
        </p>
      </div>

      {multipleProviders && (
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-2 py-3 text-sm">
            <span className="font-medium">Note:</span>
            <span className="text-muted-foreground">
              Your cart has items from {byProvider.length} providers. Checkout
              will create one order per provider.
            </span>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
              <CardDescription>Review and update quantities</CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              {byProvider.map(([providerId, providerItems]) => (
                <div key={providerId ?? "unknown"}>
                  {providerItems.map((item) => (
                    <CartItemRow
                      key={item.mealId}
                      item={item}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeItem}
                    />
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <CardDescription>Total payable at delivery (COD)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>৳{totalAmount.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Cash on Delivery. No online payment.
              </p>
            </CardContent>
            <Separator />
            <CardFooter className="flex flex-col gap-2 pt-4">
              <div className="flex w-full items-center justify-between text-lg font-semibold">
                <span>Total</span>
                <span>৳{totalAmount.toFixed(2)}</span>
              </div>
              <Button asChild className="w-full" size="lg">
                <Link href="/checkout">Proceed to checkout</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/meals">Continue shopping</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
