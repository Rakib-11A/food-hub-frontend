"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Loader2,
  ShoppingBag,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
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
        if (res.status === 200) setProfileCheck("ok");
        else setProfileCheck("missing");
      })
      .catch(() => {
        if (!cancelled) setProfileCheck("missing");
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

  // On profile page: always render something so the route never 404s
  if (pathname === "/provider/profile") {
    if (isPending) {
      return (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }
    if (!session) {
      return (
        <div className="container flex min-h-[50vh] items-center justify-center py-12">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create your provider profile</CardTitle>
              <CardDescription>
                Log in as a provider to set up your business profile and start adding meals.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild size="lg">
                <Link href="/login?callbackUrl=/provider/profile">Log in</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }
    if (session.user?.role !== "PROVIDER") {
      return (
        <div className="container flex min-h-[50vh] items-center justify-center py-12">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Provider only</CardTitle>
              <CardDescription>
                This page is for provider accounts. Log in with a provider account to create your business profile.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild variant="outline">
                <Link href="/">Back to home</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }
    // Logged-in provider: render profile form (children)
    return (
      <div className="container py-6">
        <div className="mb-6 border-b pb-4">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to home
          </Link>
        </div>
        {children}
      </div>
    );
  }

  // Other provider routes: require session and PROVIDER role
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
    return (
      <div className="container flex min-h-[50vh] items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-amber-500/10 p-2">
                <Store className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle>Provider profile required</CardTitle>
                <CardDescription>
                  You’re logged in as a provider but haven’t set up your business profile yet.
                  Create it once to access the dashboard, menu, and orders.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Alert variant="default" className="border-amber-500/30 bg-amber-500/5">
              <AlertTitle>Why am I seeing this?</AlertTitle>
              <AlertDescription>
                Provider accounts need a business profile (name, address, etc.) before they can
                add meals or receive orders. This is a one-time setup.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full sm:w-auto" size="lg">
              <Link href="/provider/profile" className="gap-2">
                <Store className="h-4 w-4" />
                Create provider profile
              </Link>
            </Button>
          </CardFooter>
        </Card>
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
