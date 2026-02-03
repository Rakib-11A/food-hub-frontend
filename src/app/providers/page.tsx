"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Store, UtensilsCrossed } from "lucide-react";
import { api } from "@/lib/api";
import type { ProviderProfile } from "@/types";
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

export default function ProvidersPage() {
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    api<ProviderProfile[]>("/api/providers")
      .then((res) => {
        if (!cancelled) setProviders(res.data ?? []);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load providers");
          setProviders([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-background text-foreground">
      <div className="container px-4 py-8 md:py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Providers
          </h1>
          <p className="mt-1 text-muted-foreground">
            Browse food providers and their menus.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2
              className="size-10 animate-spin text-muted-foreground"
              aria-hidden
            />
          </div>
        ) : providers.length === 0 ? (
          <Card className="py-16">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <Store className="size-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No providers yet</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Check back later for food providers and their menus.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/meals">Browse meals</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {providers.map((provider) => (
              <Card
                key={provider.id}
                className="overflow-hidden transition-shadow hover:shadow-md"
              >
                <Link href={`/providers/${provider.id}`} className="block">
                  <div className="relative flex aspect-[2/1] w-full items-center justify-center bg-muted">
                    {provider.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={provider.logo}
                        alt={provider.businessName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Store className="size-14 text-muted-foreground" />
                    )}
                  </div>
                </Link>
                <CardHeader className="pb-2">
                  <CardTitle className="line-clamp-1">
                    {provider.businessName}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {provider.description ?? "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <UtensilsCrossed className="size-4" />
                    <span>
                      {provider._count?.meals ?? provider.meals?.length ?? 0}{" "}
                      meal{(provider._count?.meals ?? provider.meals?.length ?? 0) !== 1 ? "s" : ""}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Button asChild className="w-full">
                    <Link href={`/providers/${provider.id}`}>
                      View menu
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
