"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, Minus, Plus, Star, Store, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useCart } from "@/contexts/cart-context";
import { useSession } from "@/lib/auth-client";
import type { Meal, Review } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

function priceValue(m: Meal): number {
  return typeof m.price === "number"
    ? m.price
    : parseFloat(String(m.price)) || 0;
}

export default function MealDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { addItem } = useCart();
  const { data: session } = useSession();
  const [meal, setMeal] = useState<Meal | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchMeal = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setNotFound(false);
      const res = await api<Meal>(`/api/meals/${id}`);
      setMeal(res.data ?? null);
      if (!res.data) setNotFound(true);
    } catch {
      setMeal(null);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchReviews = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api<Review[]>(`/api/reviews/meal/${id}`);
      setReviews(res.data ?? []);
    } catch {
      setReviews([]);
    }
  }, [id]);

  useEffect(() => {
    fetchMeal();
  }, [fetchMeal]);

  useEffect(() => {
    if (meal) fetchReviews();
  }, [meal, fetchReviews]);

  const handleAddToCart = () => {
    if (!meal || !meal.isAvailable) return;
    const price = priceValue(meal);
    const providerId = meal.providerProfileId ?? meal.providerProfile?.id;
    if (!providerId) {
      toast.error("Cannot add to cart", { description: "Meal provider is missing." });
      return;
    }
    addItem(meal.id, quantity, {
      name: meal.name,
      price,
      image: meal.image,
      providerProfileId: providerId,
    });
    toast.success("Added to cart", {
      description: `${quantity} × ${meal.name} added.`,
    });
    setQuantity(1);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || reviewRating < 1 || reviewRating > 5) return;
    setSubmittingReview(true);
    try {
      await api("/api/reviews", {
        method: "POST",
        body: JSON.stringify({
          mealId: id,
          rating: reviewRating,
          comment: reviewComment.trim() || undefined,
        }),
      });
      toast.success("Review submitted", { description: "Thanks for your feedback." });
      setReviewRating(0);
      setReviewComment("");
      fetchReviews();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to submit review"
      );
    } finally {
      setSubmittingReview(false);
    }
  };

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

  if (notFound || !meal) {
    return (
      <div className="py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Meal not found</CardTitle>
            <CardDescription>
              This meal may have been removed or the link is invalid.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/meals" className="gap-2">
                <ArrowLeft className="size-4" />
                Back to meals
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const price = priceValue(meal);

  return (
    <div className="py-6 md:py-10">
      <Button variant="ghost" size="sm" asChild className="mb-6 gap-1">
        <Link href="/meals">
          <ArrowLeft className="size-4" />
          Back to meals
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Image */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted">
          {meal.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={meal.image}
              alt={meal.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <UtensilsCrossed className="size-20" />
            </div>
          )}
          {!meal.isAvailable && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <Badge variant="secondary" className="text-base px-4 py-2">
                Unavailable
              </Badge>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-6">
          <div>
            {meal.category && (
              <Link
                href={`/meals?categoryId=${meal.categoryId}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                {meal.category.name}
              </Link>
            )}
            <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">
              {meal.name}
            </h1>
            {meal.providerProfile && (
              <Button variant="link" className="mt-2 h-auto p-0 gap-1" asChild>
                <Link href={`/providers/${meal.providerProfileId}`}>
                  <Store className="size-4" />
                  {meal.providerProfile.businessName}
                </Link>
              </Button>
            )}
          </div>

          <p className="text-muted-foreground leading-relaxed">
            {meal.description ?? "No description available."}
          </p>

          {meal.dietaryTags && meal.dietaryTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {meal.dietaryTags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">৳{price.toFixed(2)}</span>
          </div>

          <Separator />

          {/* Add to cart */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                <Minus className="size-4" />
              </Button>
              <span className="min-w-8 text-center font-medium">
                {quantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Increase quantity"
              >
                <Plus className="size-4" />
              </Button>
            </div>
            <Button
              size="lg"
              className="w-full sm:w-auto"
              onClick={handleAddToCart}
              disabled={!meal.isAvailable}
            >
              Add to cart
            </Button>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Reviews</h2>

        {session?.user?.role === "CUSTOMER" && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Leave a review</CardTitle>
              <CardDescription>
                Share your experience. You must be signed in as a customer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div className="space-y-2">
                  <Label>Rating (1–5)</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="rounded p-1 text-2xl text-amber-500 transition-colors hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        style={{
                          opacity: reviewRating >= star ? 1 : 0.35,
                        }}
                        aria-label={`${star} star${star !== 1 ? "s" : ""}`}
                      >
                        <Star
                          className="size-8 fill-current"
                          aria-hidden
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="review-comment">Comment (optional)</Label>
                  <textarea
                    id="review-comment"
                    className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="How was your meal?"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    disabled={submittingReview}
                    rows={3}
                  />
                </div>
                <Button type="submit" disabled={reviewRating < 1 || submittingReview}>
                  {submittingReview ? "Submitting…" : "Submit review"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {reviews.length === 0 ? (
          <p className="text-muted-foreground text-sm">No reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <Card key={r.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {r.user?.name ?? "Anonymous"}
                    </CardTitle>
                    <div className="flex gap-0.5 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={i < r.rating ? "opacity-100" : "opacity-30"}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  {r.comment && (
                    <CardDescription className="text-foreground/90">
                      {r.comment}
                    </CardDescription>
                  )}
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
