"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ShoppingBag } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { api } from "@/lib/api";
import type { Order } from "@/types";
import type { OrderStatus } from "@/types";
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

export default function OrdersPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session && !isPending) return;
    if (session?.user?.role !== "CUSTOMER") return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    api<Order[]>("/api/orders")
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
  }, [session, isPending]);

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

  return (
    <div className="py-8 md:py-12">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">My orders</h1>
        <p className="text-muted-foreground">
          View and track your order history.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2
            className="size-10 animate-spin text-muted-foreground"
            aria-hidden
          />
        </div>
      ) : orders.length === 0 ? (
        <Card className="py-16">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <ShoppingBag className="size-16 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No orders yet</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Your orders will appear here after you place one.
            </p>
            <Button asChild className="mt-6">
              <Link href="/meals">Browse meals</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card
              key={order.id}
              className="overflow-hidden transition-shadow hover:shadow-md"
            >
              <Link href={`/orders/${order.id}`} className="block">
                <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                  <div>
                    <CardTitle className="text-lg">
                      Order #{order.id.slice(-8).toUpperCase()}
                    </CardTitle>
                    <CardDescription>
                      {formatDate(order.placedAt)}
                      {order.providerProfile && (
                        <> · {order.providerProfile.businessName}</>
                      )}
                    </CardDescription>
                  </div>
                  <Badge variant={STATUS_VARIANTS[order.status] ?? "secondary"}>
                    {order.status}
                  </Badge>
                </CardHeader>
                <CardContent className="flex flex-row items-center justify-between pt-0">
                  <span className="text-sm text-muted-foreground">
                    {order.items?.length ?? 0} item
                    {(order.items?.length ?? 0) !== 1 ? "s" : ""}
                  </span>
                  <span className="font-semibold">
                    ৳{orderTotal(order).toFixed(2)}
                  </span>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
