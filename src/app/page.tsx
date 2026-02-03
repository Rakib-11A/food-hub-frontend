"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChefHat, UtensilsCrossed, Store, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Category, Meal } from "@/types";
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

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setError(null);
        const [categoriesRes, mealsRes] = await Promise.all([
          api<Category[]>("/api/categories"),
          api<Meal[]>("/api/meals"),
        ]);
        if (cancelled) return;
        setCategories(categoriesRes.data ?? []);
        setMeals(mealsRes.data ?? []);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load content");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  const price = (m: Meal) =>
    typeof m.price === "number" ? m.price : parseFloat(String(m.price)) || 0;

  return (
    <div className="bg-background text-foreground">
      {/* Hero */}
      <section className="container flex flex-col items-center justify-center gap-6 px-4 py-20 text-center md:py-28">
        <div className="flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
          <ChefHat className="size-4" />
          <span>FoodHub</span>
        </div>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
          Discover & order delicious meals
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Browse menus from local providers, place orders, and get food delivered
          to your door. Cash on delivery.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/meals" className="gap-2">
              <UtensilsCrossed className="size-4" />
              Browse meals
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/providers" className="gap-2">
              <Store className="size-4" />
              View providers
            </Link>
          </Button>
        </div>
      </section>

      {/* Categories */}
      <section className="border-t border-border bg-muted/30">
        <div className="container px-4 py-8 md:py-10">
          <h2 className="mb-4 text-center text-2xl font-semibold">
            Categories
          </h2>
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <Alert variant="destructive" className="max-w-2xl mx-auto">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <div className="flex flex-wrap justify-center gap-2">
              {categories
                .filter((c) => c.isActive)
                .map((cat) => (
                  <Button key={cat.id} variant="secondary" size="sm" asChild>
                    <Link href={`/meals?categoryId=${cat.id}`}>{cat.name}</Link>
                  </Button>
                ))}
              {categories.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No categories yet.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Featured / recent meals */}
      <section className="container px-4 py-10 md:py-14">
        <h2 className="mb-6 text-center text-2xl font-semibold">
          Featured meals
        </h2>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-10 animate-spin text-muted-foreground" />
          </div>
        ) : error ? null : meals.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No meals available yet. Check back soon.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {meals.slice(0, 9).map((meal) => (
              <Card
                key={meal.id}
                className="overflow-hidden transition-shadow hover:shadow-md"
              >
                <Link href={`/meals/${meal.id}`} className="block">
                  <div className="relative aspect-[4/3] w-full bg-muted">
                    {meal.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={meal.image}
                        alt={meal.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <UtensilsCrossed className="size-12" />
                      </div>
                    )}
                  </div>
                </Link>
                <CardHeader className="pb-2">
                  <CardTitle className="line-clamp-1 text-lg">
                    {meal.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {meal.description ?? "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-lg font-semibold text-foreground">
                    ৳{price(meal).toFixed(2)}
                  </p>
                  {meal.providerProfile && (
                    <p className="text-sm text-muted-foreground">
                      {meal.providerProfile.businessName}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="pt-2">
                  <Button asChild className="w-full">
                    <Link href={`/meals/${meal.id}`}>View & add to cart</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
        {!loading && !error && meals.length > 9 && (
          <div className="mt-8 text-center">
            <Button asChild variant="outline" size="lg">
              <Link href="/meals">View all meals</Link>
            </Button>
          </div>
        )}
      </section>

      {/* Quick links */}
      <section className="border-t border-border bg-muted/30">
        <div className="container px-4 py-12 md:py-16">
          <h2 className="mb-6 text-center text-2xl font-semibold">
            Get started
          </h2>
          <div className="mx-auto flex max-w-md flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild variant="secondary" className="flex-1">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href="/register">Create account</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
