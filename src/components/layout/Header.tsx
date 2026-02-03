"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChefHat,
  LayoutDashboard,
  LogOut,
  Menu,
  ShoppingBag,
  ShoppingCart,
  Store,
  User,
  UtensilsCrossed,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

const navLinks = [
  { href: "/meals", label: "Meals", icon: UtensilsCrossed },
  { href: "/providers", label: "Providers", icon: Store },
];

const roleLinkConfig: Record<
  UserRole,
  { href: string; label: string; icon: typeof User }[]
> = {
  CUSTOMER: [
    { href: "/cart", label: "Cart", icon: ShoppingCart },
    { href: "/orders", label: "My Orders", icon: ShoppingBag },
  ],
  PROVIDER: [
    { href: "/provider/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/provider/menu", label: "My Menu", icon: UtensilsCrossed },
    { href: "/provider/orders", label: "Orders", icon: ShoppingBag },
  ],
  ADMIN: [
    { href: "/admin", label: "Admin", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: User },
    { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
    { href: "/admin/categories", label: "Categories", icon: UtensilsCrossed },
  ],
};

function RoleLinksDropdown({ role }: { role: UserRole }) {
  const links = roleLinkConfig[role] ?? [];
  return (
    <>
      {links.map(({ href, label, icon: Icon }) => (
        <DropdownMenuItem key={href} asChild>
          <Link href={href} className="flex items-center gap-2">
            <Icon className="size-4" />
            {label}
          </Link>
        </DropdownMenuItem>
      ))}
    </>
  );
}

function RoleLinksMobile({ role }: { role: UserRole }) {
  const links = roleLinkConfig[role] ?? [];
  return (
    <>
      {links.map(({ href, label, icon: Icon }) => (
        <Button key={href} variant="ghost" className="justify-start gap-2" asChild>
          <Link href={href}>
            <Icon className="size-4" />
            {label}
          </Link>
        </Button>
      ))}
    </>
  );
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const role = session?.user?.role as UserRole | undefined;

  async function handleLogout() {
    const { signOut } = await import("@/lib/auth-client").then((m) => m.authClient);
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between gap-4 px-4 md:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-foreground hover:opacity-90"
        >
          <ChefHat className="size-6 text-primary" />
          <span className="hidden sm:inline">FoodHub</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Button
              key={href}
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                pathname === href && "bg-accent text-accent-foreground"
              )}
            >
              <Link href={href} className="gap-2">
                <Icon className="size-4" />
                {label}
              </Link>
            </Button>
          ))}
          {session?.user?.role === "CUSTOMER" && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/cart" className="gap-2">
                <ShoppingCart className="size-4" />
                Cart
              </Link>
            </Button>
          )}
        </nav>

        {/* Auth / User */}
        <div className="flex items-center gap-2">
          {isPending ? (
            <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
          ) : session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="size-4" />
                  <span className="max-w-[120px] truncate md:max-w-[160px]">
                    {session.user.name ?? session.user.email}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2">
                    <User className="size-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <RoleLinksDropdown role={role ?? "CUSTOMER"} />
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                <Link href="/login">Log in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Sign up</Link>
              </Button>
            </>
          )}

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="size-4" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1">
                {navLinks.map(({ href, label, icon: Icon }) => (
                  <Button
                    key={href}
                    variant="ghost"
                    className={cn(
                      "justify-start gap-2",
                      pathname === href && "bg-accent"
                    )}
                    asChild
                  >
                    <Link href={href}>
                      <Icon className="size-4" />
                      {label}
                    </Link>
                  </Button>
                ))}
                {session?.user?.role === "CUSTOMER" && (
                  <Button variant="ghost" className="justify-start gap-2" asChild>
                    <Link href="/cart">
                      <ShoppingCart className="size-4" />
                      Cart
                    </Link>
                  </Button>
                )}
                {session ? (
                  <>
                    <Button variant="ghost" className="justify-start gap-2" asChild>
                      <Link href="/profile">
                        <User className="size-4" />
                        Profile
                      </Link>
                    </Button>
                    <RoleLinksMobile role={role ?? "CUSTOMER"} />
                    <Button
                      variant="ghost"
                      className="justify-start gap-2 text-destructive"
                      onClick={handleLogout}
                    >
                      <LogOut className="size-4" />
                      Log out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" className="justify-start gap-2" asChild>
                      <Link href="/login">Log in</Link>
                    </Button>
                    <Button className="justify-start gap-2" asChild>
                      <Link href="/register">Sign up</Link>
                    </Button>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
