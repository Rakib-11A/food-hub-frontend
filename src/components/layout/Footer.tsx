"use client";

import Link from "next/link";
import { ChefHat, Mail, MapPin, UtensilsCrossed } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const footerLinks = [
  { href: "/", label: "Home" },
  { href: "/meals", label: "Meals" },
  { href: "/providers", label: "Providers" },
  { href: "/login", label: "Login" },
  { href: "/register", label: "Register" },
];

export function Footer() {
  return (
    <footer className="w-full border-t bg-muted/30">
      <div className="container px-4 py-8 md:px-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold text-foreground"
            >
              <ChefHat className="size-5 text-primary" />
              FoodHub
            </Link>
            <p className="text-sm text-muted-foreground">
              Discover and order delicious meals from your favorite local
              providers. Fresh food, delivered to you.
            </p>
          </div>

          {/* Quick links */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Quick links</h4>
            <ul className="flex flex-col gap-2">
              {footerLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Explore */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Explore</h4>
            <ul className="flex flex-col gap-2">
              <li>
                <Link
                  href="/meals"
                  className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <UtensilsCrossed className="size-4" />
                  Browse meals
                </Link>
              </li>
              <li>
                <Link
                  href="/providers"
                  className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <MapPin className="size-4" />
                  Find providers
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact placeholder */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Contact</h4>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="size-4 shrink-0" />
              support@foodhub.example
            </p>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="flex flex-col items-center justify-between gap-4 text-center text-sm text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} FoodHub. All rights reserved.</p>
          <p>Cash on Delivery • No payment integration</p>
        </div>
      </div>
    </footer>
  );
}
