"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Banknote, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { api } from "@/lib/api";
import { useCart } from "@/contexts/cart-context";
import type { CartItem } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { items, totalAmount, clearCart } = useCart();
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ordersByProvider = useMemo(() => {
    const map = new Map<string, CartItem[]>();
    for (const item of items) {
      const key = item.providerProfileId ?? "unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries());
  }, [items]);

  const isEmpty = items.length === 0;

  // Protected: redirect if not customer
  if (!isPending && (!session || session.user?.role !== "CUSTOMER")) {
    router.replace("/login");
    return null;
  }

  if (!isPending && session?.user?.role !== "CUSTOMER") {
    return null;
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      if (isEmpty) {
        toast.error("Cart is empty");
        return;
      }
      if (!deliveryAddress.trim()) {
        setError("Delivery address is required.");
        return;
      }

      setSubmitting(true);
      try {
        for (const [providerProfileId, providerItems] of ordersByProvider) {
          if (providerProfileId === "unknown") {
            throw new Error("Some items have no provider. Remove them and try again.");
          }
          await api("/api/orders", {
            method: "POST",
            body: JSON.stringify({
              providerProfileId,
              deliveryAddress: deliveryAddress.trim(),
              contactPhone: contactPhone.trim() || undefined,
              paymentMethod: "COD",
              items: providerItems.map((i) => ({
                mealId: i.mealId,
                quantity: i.quantity,
              })),
            }),
          });
        }
        clearCart();
        toast.success("Order placed", {
          description: "Your order has been placed. Cash on delivery.",
        });
        router.replace("/orders");
        router.refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to place order";
        setError(msg);
        toast.error("Order failed", { description: msg });
      } finally {
        setSubmitting(false);
      }
    },
    [
      isEmpty,
      deliveryAddress,
      contactPhone,
      ordersByProvider,
      clearCart,
      router,
    ]
  );

  if (isPending) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center py-16">
        <Loader2
          className="size-10 animate-spin text-muted-foreground"
          aria-hidden
        />
      </div>
    );
  }

  if (isEmpty && session?.user?.role === "CUSTOMER") {
    return (
      <div className="py-8 md:py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Cart is empty</CardTitle>
            <CardDescription>
              Add items to your cart before checkout.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/meals">Browse meals</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-8 md:py-12">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
        <p className="text-muted-foreground">
          Enter delivery details. Pay when your order arrives (COD).
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="size-5" />
                  Delivery details
                </CardTitle>
                <CardDescription>
                  Where should we deliver your order?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription className="space-y-2">
                      <span className="block">{error}</span>
                      {error.includes("remove them from your cart") && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2 border-destructive text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            clearCart();
                            setError(null);
                            toast.info("Cart cleared. You can add items again from the menu.");
                          }}
                        >
                          Clear cart and start over
                        </Button>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="deliveryAddress">Delivery address *</Label>
                  <Input
                    id="deliveryAddress"
                    placeholder="Street, area, city"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    required
                    disabled={submitting}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact phone</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    placeholder="Optional"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    disabled={submitting}
                    className="bg-background"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="size-5" />
                  Payment
                </CardTitle>
                <CardDescription>
                  Cash on Delivery (COD). No online payment.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Order total</span>
                  <span className="font-medium">৳{totalAmount.toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {ordersByProvider.length} order
                  {ordersByProvider.length !== 1 ? "s" : ""} (one per provider)
                </p>
              </CardContent>
              <Separator />
              <CardFooter className="flex flex-col gap-2 pt-4">
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Placing order…
                    </>
                  ) : (
                    "Place order"
                  )}
                </Button>
                <Button asChild variant="outline" className="w-full" type="button">
                  <Link href="/cart">Back to cart</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
