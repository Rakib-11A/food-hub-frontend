"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  LayoutDashboard,
  Loader2,
  ShoppingBag,
  User,
  UtensilsCrossed,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Category, Order } from "@/types";
import type { UserAdmin } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const statLinks = [
  {
    href: "/admin/users",
    label: "Users",
    description: "Manage user accounts and status",
    icon: User,
    accent: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  },
  {
    href: "/admin/orders",
    label: "Orders",
    description: "View all platform orders",
    icon: ShoppingBag,
    accent: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  },
  {
    href: "/admin/categories",
    label: "Categories",
    description: "Manage meal categories",
    icon: UtensilsCrossed,
    accent: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  },
];

export default function AdminDashboardPage() {
  const [userCount, setUserCount] = useState<number | null>(null);
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [categoryCount, setCategoryCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      api<UserAdmin[]>("/api/admin/users")
        .then((res) => (cancelled ? null : (res.data ?? []).length))
        .catch(() => (cancelled ? null : 0)),
      api<Order[]>("/api/admin/orders")
        .then((res) => (cancelled ? null : (res.data ?? []).length))
        .catch(() => (cancelled ? null : 0)),
      api<Category[]>("/api/categories")
        .then((res) => (cancelled ? null : (res.data ?? []).length))
        .catch(() => (cancelled ? null : 0)),
    ])
      .then(([u, o, c]) => {
        if (cancelled) return;
        setUserCount(u ?? null);
        setOrderCount(o ?? null);
        setCategoryCount(c ?? null);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load counts");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2
            className="h-10 w-10 animate-spin text-muted-foreground"
            aria-hidden
          />
          <p className="text-sm text-muted-foreground">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Overview and quick links to manage the platform.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="overflow-hidden">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg border bg-muted/50 p-3">
              <User className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {userCount ?? "—"}
              </p>
              <p className="text-sm text-muted-foreground">Users</p>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg border bg-muted/50 p-3">
              <ShoppingBag className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {orderCount ?? "—"}
              </p>
              <p className="text-sm text-muted-foreground">Orders</p>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg border bg-muted/50 p-3">
              <UtensilsCrossed className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {categoryCount ?? "—"}
              </p>
              <p className="text-sm text-muted-foreground">Categories</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" />
            Quick links
          </CardTitle>
          <CardDescription>
            Jump to each section to manage users, orders, and categories.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {statLinks.map(({ href, label, description, icon: Icon, accent }) => (
            <Link key={href} href={href}>
              <div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${accent}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{label}</p>
                    <p className="text-sm text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
