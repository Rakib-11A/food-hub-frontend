"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, Loader2, UtensilsCrossed, X } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DIETARY_OPTIONS = [
  { value: "", label: "All" },
  { value: "Vegetarian", label: "Vegetarian" },
  { value: "Vegan", label: "Vegan" },
  { value: "Gluten-Free", label: "Gluten-Free" },
  { value: "Halal", label: "Halal" },
  { value: "Spicy", label: "Spicy" },
];

function buildMealsQuery(params: URLSearchParams): string {
  const q = new URLSearchParams();
  const categoryId = params.get("categoryId");
  const dietary = params.get("dietary");
  const minPrice = params.get("minPrice");
  const maxPrice = params.get("maxPrice");
  if (categoryId) q.set("categoryId", categoryId);
  if (dietary) q.set("dietary", dietary);
  if (minPrice) q.set("minPrice", minPrice);
  if (maxPrice) q.set("maxPrice", maxPrice);
  const s = q.toString();
  return s ? `?${s}` : "";
}

function MealCard({ meal }: { meal: Meal }) {
  const price =
    typeof meal.price === "number"
      ? meal.price
      : parseFloat(String(meal.price)) || 0;
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
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
        <CardTitle className="line-clamp-1 text-lg">{meal.name}</CardTitle>
        <CardDescription className="line-clamp-2">
          {meal.description ?? "No description"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-lg font-semibold text-foreground">
          ৳{price.toFixed(2)}
        </p>
        {meal.providerProfile && (
          <p className="text-sm text-muted-foreground">
            {meal.providerProfile.businessName}
          </p>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <Button asChild className="w-full">
          <Link href={`/meals/${meal.id}`}>View details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function MealsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categoryId = searchParams.get("categoryId") ?? "";
  const dietary = searchParams.get("dietary") ?? "";
  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";

  const setFilter = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      const q = next.toString();
      router.replace(q ? `/meals?${q}` : "/meals", { scroll: false });
    },
    [searchParams, router]
  );

  const clearFilters = useCallback(() => {
    router.replace("/meals", { scroll: false });
  }, [router]);

  const hasActiveFilters =
    categoryId || dietary || minPrice || maxPrice;

  useEffect(() => {
    let cancelled = false;

    async function fetchCategories() {
      try {
        const res = await api<Category[]>("/api/categories");
        if (cancelled) return;
        setCategories(res.data ?? []);
      } catch {
        if (cancelled) return;
        setCategories([]);
      }
    }

    fetchCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const query = buildMealsQuery(searchParams);

    api<Meal[]>(`/api/meals${query}`)
      .then((res) => {
        if (!cancelled) setMeals(res.data ?? []);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load meals");
          setMeals([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <div className="bg-background text-foreground">
      <div className="container px-4 py-8 md:py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Browse meals
          </h1>
          <p className="mt-1 text-muted-foreground">
            Filter by category, dietary preference, or price range.
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8 border-border bg-muted/20">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="size-4 text-muted-foreground" />
                <CardTitle className="text-lg">Filters</CardTitle>
              </div>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="gap-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                  Clear all
                </Button>
              )}
            </div>
            <CardDescription>
              Refine results by category, diet, or price.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={categoryId || "all"}
                  onValueChange={(v) =>
                    setFilter("categoryId", v === "all" ? "" : v)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories
                      .filter((c) => c.isActive)
                      .map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Dietary</Label>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_OPTIONS.map((opt) => (
                    <Button
                      key={opt.value || "all"}
                      variant={dietary === opt.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilter("dietary", opt.value)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minPrice">Min price (৳)</Label>
                <Input
                  id="minPrice"
                  type="number"
                  min={0}
                  step={10}
                  placeholder="0"
                  value={minPrice}
                  onChange={(e) => setFilter("minPrice", e.target.value)}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxPrice">Max price (৳)</Label>
                <Input
                  id="maxPrice"
                  type="number"
                  min={0}
                  step={10}
                  placeholder="Any"
                  value={maxPrice}
                  onChange={(e) => setFilter("maxPrice", e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2
              className="size-10 animate-spin text-muted-foreground"
              aria-hidden
            />
          </div>
        ) : meals.length === 0 ? (
          <Card className="py-16">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <UtensilsCrossed className="size-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No meals found</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Try adjusting your filters or check back later for new options.
              </p>
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Clear filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {meals.length} meal{meals.length !== 1 ? "s" : ""} found
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {meals.map((meal) => (
                <MealCard key={meal.id} meal={meal} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
