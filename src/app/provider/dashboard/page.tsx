"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Package,
  ShoppingBag,
  Truck,
  XCircle,
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; icon: typeof Package; variant: "default" | "secondary" | "destructive" | "outline"; accent: string }
> = {
  PLACED: {
    label: "Placed",
    icon: Package,
    variant: "secondary",
    accent: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  },
  PREPARING: {
    label: "Preparing",
    icon: AlertCircle,
    variant: "default",
    accent: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  },
  READY: {
    label: "Ready",
    icon: CheckCircle2,
    variant: "default",
    accent: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  },
  DELIVERED: {
    label: "Delivered",
    icon: Truck,
    variant: "outline",
    accent: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: XCircle,
    variant: "destructive",
    accent: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  },
};

const RECENT_LIMIT = 8;

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

export default function ProviderDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api<Order[]>("/api/provider/orders")
      .then((res) => {
        if (!cancelled) setOrders(res.data ?? []);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load orders");
          setOrders([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const countsByStatus = Object.keys(STATUS_CONFIG).reduce(
    (acc, status) => {
      acc[status as OrderStatus] = orders.filter((o) => o.status === status).length;
      return acc;
    },
    {} as Record<OrderStatus, number>
  );

  const totalOrders = orders.length;
  const recentOrders = orders
    .slice()
    .sort(
      (a, b) =>
        new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
    )
    .slice(0, RECENT_LIMIT);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Overview of your orders and activity.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!error && orders.length === 0 ? (
        <Card className="overflow-hidden border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="mt-4 text-xl font-semibold">No orders yet</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              When customers place orders from your menu, they will show up here.
              Add meals to your menu to start receiving orders.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link href="/provider/menu">Manage menu</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/provider/orders">View orders</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {(Object.entries(STATUS_CONFIG) as [OrderStatus, (typeof STATUS_CONFIG)[OrderStatus]][]).map(
              ([status, config]) => {
                const count = countsByStatus[status];
                const Icon = config.icon;
                return (
                  <Card
                    key={status}
                    className="relative overflow-hidden transition-shadow hover:shadow-md"
                  >
                    <CardContent className="p-5">
                      <div
                        className={`mb-3 inline-flex rounded-lg border p-2 ${config.accent}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="text-2xl font-bold tabular-nums">{count}</p>
                      <p className="text-sm font-medium text-muted-foreground">
                        {config.label}
                      </p>
                    </CardContent>
                  </Card>
                );
              }
            )}
          </div>

          {/* Summary strip */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
              <p className="text-sm font-medium text-muted-foreground">
                Total orders
              </p>
              <p className="text-2xl font-bold tabular-nums">{totalOrders}</p>
            </CardContent>
          </Card>

          {/* Recent orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Recent orders</CardTitle>
                <CardDescription>
                  Latest orders from your menu. Manage status in Orders.
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/provider/orders" className="gap-1">
                  View all
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <ul className="divide-y rounded-lg border">
                {recentOrders.map((order) => {
                  const config = STATUS_CONFIG[order.status];
                  const Icon = config.icon;
                  return (
                    <li key={order.id}>
                      <Link
                        href="/provider/orders"
                        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/50 sm:flex-nowrap"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${config.accent}`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium">
                              {orderShortId(order.id)}
                            </p>
                            <p className="truncate text-sm text-muted-foreground">
                              {order.customer?.name ?? order.customer?.email ?? "Customer"}
                              <span className="ml-1.5">
                                · {formatDate(order.placedAt)}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <Badge variant={config.variant}>{order.status}</Badge>
                          <span className="font-semibold tabular-nums">
                            ৳{orderTotal(order).toFixed(2)}
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
            <CardFooter className="border-t bg-muted/30">
              <Button asChild className="w-full sm:w-auto">
                <Link href="/provider/orders" className="gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  View all orders
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
}
