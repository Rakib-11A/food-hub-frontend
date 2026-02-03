"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Loader2,
  MapPin,
  ShoppingBag,
  User,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Order, OrderStatus } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

function orderShortId(id: string): string {
  return "#" + id.slice(-8).toUpperCase();
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setError(null);
    try {
      const res = await api<Order[]>("/api/admin/orders");
      setOrders(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const sortedOrders = [...orders].sort(
    (a, b) =>
      new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
  );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2
            className="h-10 w-10 animate-spin text-muted-foreground"
            aria-hidden
          />
          <p className="text-sm text-muted-foreground">Loading orders…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="mt-1 text-muted-foreground">
          All platform orders. Read-only overview.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!error && sortedOrders.length === 0 ? (
        <Card className="overflow-hidden border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="mt-4 text-xl font-semibold">No orders</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Orders from customers will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedOrders.map((order) => {
            const customerLabel =
              order.customer?.name ?? order.customer?.email ?? "—";
            const providerLabel =
              order.providerProfile?.businessName ?? "—";

            return (
              <Card
                key={order.id}
                className="overflow-hidden transition-shadow hover:shadow-md"
              >
                <CardHeader className="flex flex-col gap-3 space-y-0 pb-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {orderShortId(order.id)}
                    </CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        {customerLabel}
                      </span>
                      <span>{formatDate(order.placedAt)}</span>
                      {providerLabel !== "—" && (
                        <span className="text-muted-foreground">
                          · {providerLabel}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant={STATUS_VARIANTS[order.status]}>
                      {order.status}
                    </Badge>
                    <Button variant="ghost" size="sm" asChild>
                      <Link
                        href={`/orders/${order.id}`}
                        className="gap-1"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {order.deliveryAddress && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{order.deliveryAddress}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {(order.items ?? []).length} item
                      {(order.items ?? []).length !== 1 ? "s" : ""}
                    </span>
                    <span className="font-semibold tabular-nums">
                      ৳{orderTotal(order).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
