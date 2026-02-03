"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Loader2,
  ShoppingBag,
  User,
  UtensilsCrossed,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: User },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/categories", label: "Categories", icon: UtensilsCrossed },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (session.user?.role !== "ADMIN") {
      router.replace("/");
    }
  }, [isPending, session, router]);

  const isAdmin = session?.user?.role === "ADMIN";
  if (isPending || !session || !isAdmin) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container py-6">
      <nav className="mb-6 flex flex-wrap items-center gap-2 border-b pb-4">
        {adminNav.map(({ href, label, icon: Icon }) => (
          <Button
            key={href}
            variant={pathname === href ? "secondary" : "ghost"}
            size="sm"
            asChild
          >
            <Link
              href={href}
              className={cn("gap-2", pathname === href && "font-medium")}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          </Button>
        ))}
      </nav>
      {children}
    </div>
  );
}
