"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Loader2,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const providerNav = [
  { href: "/provider/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/provider/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/provider/orders", label: "Orders", icon: ShoppingBag },
];

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = useSession();

  if (!isPending && !session) {
    router.replace("/login");
    return null;
  }
  if (!isPending && session?.user?.role !== "PROVIDER") {
    router.replace("/");
    return null;
  }
  if (isPending || !session) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container py-6">
      <nav className="mb-6 flex flex-wrap items-center gap-2 border-b pb-4">
        {providerNav.map(({ href, label, icon: Icon }) => (
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
