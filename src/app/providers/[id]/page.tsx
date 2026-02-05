"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Phone,
  ShoppingCart,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useCart } from "@/contexts/cart-context";
import type { Meal, ProviderProfile } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function mealPrice(m: Meal): number {
  return typeof m.price === "number"
    ? m.price
    : parseFloat(String(m.price)) || 0;
}

function MealCard({
  meal,
  onAddToCart,
}: {
  meal: Meal;
  onAddToCart: (meal: Meal) => void;
}) {
  const price = mealPrice(meal);
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
      </CardContent>
      <CardFooter className="flex gap-2 pt-2">
        <Button asChild variant="outline" className="flex-1">
          <Link href={`/meals/${meal.id}`}>View</Link>
        </Button>
        <Button
          className="flex-1 gap-1"
          onClick={(e) => {
            e.preventDefault();
            onAddToCart(meal);
          }}
          disabled={!meal.isAvailable}
        >
          <ShoppingCart className="size-4" />
          Add to cart
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function ProviderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { addItem } = useCart();
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const fetchProvider = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setNotFound(false);
      const res = await api<ProviderProfile>(`/api/providers/${id}`);
      setProvider(res.data ?? null);
      if (!res.data) setNotFound(true);
    } catch {
      setProvider(null);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProvider();
  }, [fetchProvider]);

  const handleAddToCart = useCallback(
    (meal: Meal) => {
      const price = mealPrice(meal);
      const providerId = meal.providerProfileId ?? meal.providerProfile?.id;
      if (!providerId) {
        toast.error("Cannot add to cart", { description: "Meal provider is missing." });
        return;
      }
      addItem(meal.id, 1, {
        name: meal.name,
        price,
        image: meal.image,
        providerProfileId: providerId,
      });
      toast.success("Added to cart", {
        description: `${meal.name} added.`,
      });
    },
    [addItem]
  );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center py-16">
        <Loader2
          className="size-10 animate-spin text-muted-foreground"
          aria-hidden
        />
      </div>
    );
  }

  if (notFound || !provider) {
    return (
      <div className="py-12">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>Provider not found</CardTitle>
            <CardDescription>
              This provider may have been removed or the link is invalid.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/providers" className="gap-2">
                <ArrowLeft className="size-4" />
                Back to providers
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const meals = provider.meals ?? [];

  return (
    <div className="py-6 md:py-10">
      <Button variant="ghost" size="sm" asChild className="mb-6 gap-1">
        <Link href="/providers">
          <ArrowLeft className="size-4" />
          Back to providers
        </Link>
      </Button>

      {/* Provider info */}
      <Card className="mb-8 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="relative flex aspect-[2/1] w-full items-center justify-center bg-muted md:aspect-auto md:max-w-sm">
            {provider.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={provider.logo}
                alt={provider.businessName}
                className="h-full w-full object-cover"
              />
            ) : (
              <Store className="size-20 text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-1 flex-col justify-center p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-2xl md:text-3xl">
                {provider.businessName}
              </CardTitle>
              <CardDescription className="text-base">
                {provider.description ?? "No description."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 p-0">
              {provider.address && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="size-4 shrink-0" />
                  <span>{provider.address}</span>
                </div>
              )}
              {provider.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="size-4 shrink-0" />
                  <span>{provider.phone}</span>
                </div>
              )}
              {provider.user && (
                <p className="text-sm text-muted-foreground">
                  Contact: {provider.user.name}
                </p>
              )}
            </CardContent>
          </div>
        </div>
      </Card>

      {/* Menu */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Menu</h2>
        {meals.length === 0 ? (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <UtensilsCrossed className="size-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">
                No meals on the menu yet.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/meals">Browse all meals</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {meals.map((meal) => (
              <MealCard
                key={meal.id}
                meal={meal}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
