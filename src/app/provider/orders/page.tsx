"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  MapPin,
  ShoppingBag,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Order, OrderStatus } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const STATUS_OPTIONS: OrderStatus[] = [
  "PLACED",
  "PREPARING",
  "READY",
  "DELIVERED",
  "CANCELLED",
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  PLACED: "Placed",
  PREPARING: "Preparing",
  READY: "Ready",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

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

const PROFILE_ERROR = "provider profile not found";
const CREATE_PROFILE_ERROR = "create a provider profile";

export default function ProviderOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setError(null);
    try {
      const res = await api<Order[]>("/api/provider/orders");
      setOrders(res.data ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load orders";
      setError(msg);
      setOrders([]);
      if (msg.toLowerCase().includes(PROFILE_ERROR) || msg.toLowerCase().includes(CREATE_PROFILE_ERROR)) {
        router.replace("/provider/profile");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusChange = useCallback(
    async (orderId: string, status: OrderStatus) => {
      setUpdatingOrderId(orderId);
      try {
        await api(`/api/provider/orders/${orderId}`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        });
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status } : o))
        );
        toast.success("Order updated", {
          description: `Status set to ${STATUS_LABELS[status]}.`,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Update failed";
        toast.error("Could not update order", { description: msg });
      } finally {
        setUpdatingOrderId(null);
      }
    },
    []
  );

  const sortedOrders = [...orders].sort(
    (a, b) =>
      new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
  );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" aria-hidden />
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
          View and update order status. Move orders through: Placed → Preparing → Ready → Delivered (or Cancelled).
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
            <h2 className="mt-4 text-xl font-semibold">No orders yet</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Orders from customers will appear here. Share your menu to start receiving orders.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedOrders.map((order) => {
            const isUpdating = updatingOrderId === order.id;
            const customerLabel =
              order.customer?.name ?? order.customer?.email ?? "Customer";

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
                    </CardDescription>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant={STATUS_VARIANTS[order.status]}>
                      {order.status}
                    </Badge>
                    <Select
                      value={order.status}
                      onValueChange={(value) =>
                        handleStatusChange(order.id, value as OrderStatus)
                      }
                      disabled={isUpdating}
                    >
                      <SelectTrigger
                        className="w-[140px]"
                        aria-label="Change order status"
                      >
                        {isUpdating ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Updating…
                          </span>
                        ) : (
                          <SelectValue placeholder="Status" />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {STATUS_LABELS[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  {order.deliveryAddress && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{order.deliveryAddress}</span>
                    </div>
                  )}
                  <ul className="space-y-1.5 rounded-md border bg-muted/30 px-3 py-2">
                    {(order.items ?? []).map((item, idx) => (
                      <li
                        key={item.mealId + String(idx)}
                        className="flex justify-between text-sm"
                      >
                        <span>
                          {item.meal?.name ?? `Meal`} × {item.quantity}
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          ৳
                          {(
                            (typeof item.unitPrice === "number"
                              ? item.unitPrice
                              : parseFloat(String(item.unitPrice)) || 0) *
                            item.quantity
                          ).toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Separator />
                  <div className="flex justify-between text-sm font-medium">
                    <span>Total</span>
                    <span className="tabular-nums">
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
