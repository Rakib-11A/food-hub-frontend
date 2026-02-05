"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

const API_BASE =
  typeof process.env.NEXT_PUBLIC_API_URL === "string"
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")
    : "";

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const [profileCheck, setProfileCheck] = useState<"loading" | "ok" | "missing">("loading");
  const isProfilePage = pathname === "/provider/profile";

  useEffect(() => {
    if (!session || session.user?.role !== "PROVIDER" || !API_BASE || isProfilePage) {
      if (isProfilePage) setProfileCheck("ok");
      return;
    }
    let cancelled = false;
    setProfileCheck("loading");
    fetch(`${API_BASE}/api/providers/profile`, { credentials: "include" })
      .then((res) => {
        if (cancelled) return;
        if (res.status === 404) setProfileCheck("missing");
        else setProfileCheck("ok");
      })
      .catch(() => {
        if (!cancelled) setProfileCheck("ok");
      });
    return () => {
      cancelled = true;
    };
  }, [session, isProfilePage]);

  useEffect(() => {
    if (profileCheck === "missing" && !isProfilePage) {
      router.replace("/provider/profile");
    }
  }, [profileCheck, isProfilePage, router]);

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

  if (!isProfilePage && profileCheck === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isProfilePage && profileCheck === "missing") {
    return null;
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
        <Button variant="ghost" size="sm" asChild>
          <Link href="/provider/profile" className="gap-2">
            Profile
          </Link>
        </Button>
      </nav>
      {children}
    </div>
  );
}
