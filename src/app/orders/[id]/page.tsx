"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, MapPin, Package, Star } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { api } from "@/lib/api";
import type { Order } from "@/types";
import type { OrderStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const STATUS_VARIANTS: Record<
  OrderStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PLACED: "secondary",
  PREPARING: "default",
  READY: "default",
  DELIVERED: "outline",
  CANCELLED: "destructive",
};

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function orderTotal(o: Order): number {
  return typeof o.totalAmount === "number"
    ? o.totalAmount
    : parseFloat(String(o.totalAmount)) || 0;
}

function itemSubtotal(unitPrice: string | number, quantity: number): number {
  const up = typeof unitPrice === "number" ? unitPrice : parseFloat(String(unitPrice)) || 0;
  return up * quantity;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: session, isPending } = useSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setForbidden(false);
      setNotFound(false);
      const res = await api<Order>(`/api/orders/${id}`);
      setOrder(res.data ?? null);
      if (!res.data) setNotFound(true);
    } catch (err) {
      setOrder(null);
      const message = err instanceof Error ? err.message : "";
      if (message.includes("403") || message.toLowerCase().includes("forbidden")) {
        setForbidden(true);
      } else {
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!session && !isPending) return;
    if (session?.user?.role !== "CUSTOMER") return;
    fetchOrder();
  }, [session, isPending, fetchOrder]);

  if (!isPending && (!session || session.user?.role !== "CUSTOMER")) {
    router.replace("/login");
    return null;
  }

  if (isPending && !session) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center py-16">
        <Loader2
          className="size-10 animate-spin text-muted-foreground"
          aria-hidden
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center py-16">
        <Loader2
          className="size-10 animate-spin text-muted-foreground"
          aria-hidden
        />
      </div>
    );
  }

  if (forbidden || notFound || !order) {
    return (
      <div className="py-12">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>
              {forbidden ? "Access denied" : "Order not found"}
            </CardTitle>
            <CardDescription>
              {forbidden
                ? "You don't have permission to view this order."
                : "This order may not exist or the link is invalid."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/orders" className="gap-2">
                <ArrowLeft className="size-4" />
                Back to my orders
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const total = orderTotal(order);

  return (
    <div className="py-6 md:py-10">
      <Button variant="ghost" size="sm" asChild className="mb-6 gap-1">
        <Link href="/orders">
          <ArrowLeft className="size-4" />
          Back to my orders
        </Link>
      </Button>

      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Order #{order.id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-muted-foreground">
            Placed {formatDate(order.placedAt)}
          </p>
        </div>
        <Badge
          variant={STATUS_VARIANTS[order.status] ?? "secondary"}
          className="w-fit text-sm"
        >
          {order.status}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="size-5" />
                Items
              </CardTitle>
              {order.providerProfile && (
                <CardDescription>
                  From {order.providerProfile.businessName}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {order.items?.map((item) => (
                  <li key={item.mealId} className="flex flex-col gap-2 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {item.meal?.name ?? `Meal ${item.mealId.slice(-6)}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} × ৳
                        {(
                          typeof item.unitPrice === "number"
                            ? item.unitPrice
                            : parseFloat(String(item.unitPrice)) || 0
                        ).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">
                        ৳
                        {itemSubtotal(
                          item.unitPrice,
                          item.quantity
                        ).toFixed(2)}
                      </span>
                      <Button variant="ghost" size="sm" asChild className="gap-1 text-primary">
                        <Link href={`/meals/${item.mealId}`}>
                          <Star className="size-4" />
                          Leave review
                        </Link>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="size-5" />
                Delivery
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">{order.deliveryAddress}</p>
              {order.contactPhone && (
                <p className="text-sm text-muted-foreground">
                  Phone: {order.contactPhone}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Cash on Delivery
                {order.paymentMethod ? ` · ${order.paymentMethod}` : ""}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold">৳{total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
