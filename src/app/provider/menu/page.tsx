"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Pencil,
  Plus,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Category, Meal, Order } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const DIETARY_PLACEHOLDER = "e.g. Vegetarian, Vegan, Gluten-Free";

function parseDietaryTags(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function formatDietaryTags(tags: string[]): string {
  return tags.join(", ");
}

function mealPrice(meal: Meal): number {
  return typeof meal.price === "number"
    ? meal.price
    : parseFloat(String(meal.price)) || 0;
}

const PROFILE_ERROR = "provider profile not found";
const CREATE_PROFILE_ERROR = "create a provider profile";

export default function ProviderMenuPage() {
  const router = useRouter();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [dietaryTagsStr, setDietaryTagsStr] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);

  const isEditing = editingMeal != null;

  const loadMeals = useCallback(async () => {
    setError(null);
    try {
      const res = await api<Meal[]>("/api/provider/meals");
      if (res.data != null) {
        setMeals(res.data);
        return;
      }
    } catch {
      // Fallback: get providerProfileId from orders, then filter meals
    }
    try {
      const ordersRes = await api<Order[]>("/api/provider/orders");
      const orders = ordersRes.data ?? [];
      const providerProfileId = orders[0]?.providerProfileId;
      if (!providerProfileId) {
        setMeals([]);
        return;
      }
      const mealsRes = await api<Meal[]>("/api/meals");
      const all = mealsRes.data ?? [];
      setMeals(all.filter((m) => m.providerProfileId === providerProfileId));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load menu";
      setError(msg);
      setMeals([]);
      if (msg.toLowerCase().includes(PROFILE_ERROR) || msg.toLowerCase().includes(CREATE_PROFILE_ERROR)) {
        router.replace("/provider/profile");
      }
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      loadMeals(),
      api<Category[]>("/api/categories").then((res) => {
        if (!cancelled) setCategories(res.data ?? []);
      }),
    ])
      .catch((err) => {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Failed to load data";
          setError(msg);
          if (msg.toLowerCase().includes(PROFILE_ERROR) || msg.toLowerCase().includes(CREATE_PROFILE_ERROR)) {
            router.replace("/provider/profile");
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loadMeals, router]);

  const resetForm = useCallback(() => {
    setName("");
    setDescription("");
    setPrice("");
    setImage("");
    setCategoryId("");
    setDietaryTagsStr("");
    setIsAvailable(true);
    setEditingMeal(null);
    setFormError(null);
  }, []);

  const openCreate = useCallback(() => {
    resetForm();
    setSheetOpen(true);
  }, [resetForm]);

  const openEdit = useCallback((meal: Meal) => {
    setEditingMeal(meal);
    setName(meal.name);
    setDescription(meal.description ?? "");
    setPrice(String(mealPrice(meal)));
    setImage(meal.image ?? "");
    setCategoryId(meal.categoryId ?? "");
    setDietaryTagsStr(formatDietaryTags(meal.dietaryTags ?? []));
    setIsAvailable(meal.isAvailable);
    setFormError(null);
    setSheetOpen(true);
  }, []);

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    resetForm();
  }, [resetForm]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFormError(null);
      const trimmedName = name.trim();
      if (!trimmedName) {
        setFormError("Name is required.");
        return;
      }
      const priceNum = parseFloat(price);
      if (Number.isNaN(priceNum) || priceNum < 0) {
        setFormError("Enter a valid price.");
        return;
      }
      const dietaryTags = parseDietaryTags(dietaryTagsStr);
      const body = {
        name: trimmedName,
        description: description.trim() || undefined,
        price: priceNum,
        image: image.trim() || undefined,
        categoryId: categoryId.trim() || undefined,
        dietaryTags,
        isAvailable,
      };

      setSubmitting(true);
      try {
        if (isEditing && editingMeal) {
          await api(`/api/provider/meals/${editingMeal.id}`, {
            method: "PUT",
            body: JSON.stringify(body),
          });
          toast.success("Meal updated");
        } else {
          await api("/api/provider/meals", {
            method: "POST",
            body: JSON.stringify(body),
          });
          toast.success("Meal added");
        }
        closeSheet();
        await loadMeals();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Request failed";
        setFormError(msg);
        toast.error(isEditing ? "Update failed" : "Add failed", {
          description: msg,
        });
      } finally {
        setSubmitting(false);
      }
    },
    [
      name,
      description,
      price,
      image,
      categoryId,
      dietaryTagsStr,
      isAvailable,
      isEditing,
      editingMeal,
      closeSheet,
      loadMeals,
    ]
  );

  const handleDelete = useCallback(
    async (meal: Meal) => {
      if (!window.confirm(`Delete "${meal.name}"? This cannot be undone.`)) return;
      setDeletingId(meal.id);
      try {
        await api(`/api/provider/meals/${meal.id}`, { method: "DELETE" });
        toast.success("Meal deleted");
        await loadMeals();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Delete failed";
        toast.error("Delete failed", { description: msg });
      } finally {
        setDeletingId(null);
      }
    },
    [loadMeals]
  );

  const activeCategories = useMemo(
    () => categories.filter((c) => c.isActive),
    [categories]
  );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">Loading menu…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Menu</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your meals. Add, edit, or remove items.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 sm:shrink-0">
          <Plus className="h-4 w-4" />
          Add meal
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!error && meals.length === 0 ? (
        <Card className="overflow-hidden border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4">
              <UtensilsCrossed className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="mt-4 text-xl font-semibold">No meals yet</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Add your first meal to start receiving orders. Set name, price,
              category, and optional details.
            </p>
            <Button onClick={openCreate} className="mt-6 gap-2">
              <Plus className="h-4 w-4" />
              Add meal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {meals.map((meal) => (
            <Card
              key={meal.id}
              className="flex flex-col overflow-hidden transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-4/3 w-full shrink-0 bg-muted">
                {meal.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={meal.image}
                    alt={meal.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <UtensilsCrossed className="h-10 w-10" />
                  </div>
                )}
                <div className="absolute right-2 top-2">
                  <Badge
                    variant={meal.isAvailable ? "default" : "secondary"}
                    className={cn(
                      !meal.isAvailable && "bg-muted-foreground/80 text-muted"
                    )}
                  >
                    {meal.isAvailable ? "Available" : "Unavailable"}
                  </Badge>
                </div>
              </div>
              <CardHeader className="flex-1 pb-2">
                <CardTitle className="line-clamp-1 text-lg">{meal.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {meal.description ?? "No description"}
                </CardDescription>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(meal.dietaryTags ?? []).slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {(meal.dietaryTags?.length ?? 0) > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{(meal.dietaryTags?.length ?? 0) - 3}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between border-t pt-4">
                <span className="font-semibold tabular-nums">
                  ৳{mealPrice(meal).toFixed(2)}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(meal)}
                    className="gap-1"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(meal)}
                    disabled={deletingId === meal.id}
                    className="gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    {deletingId === meal.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={(open) => !open && closeSheet()}>
        <SheetContent
          side="right"
          className="flex w-full flex-col overflow-y-auto sm:max-w-md"
        >
          <SheetHeader>
            <SheetTitle>{isEditing ? "Edit meal" : "Add meal"}</SheetTitle>
            <SheetDescription>
              {isEditing
                ? "Update the meal details below."
                : "Fill in the details for your new meal."}
            </SheetDescription>
          </SheetHeader>
          <form
            id="meal-form"
            onSubmit={handleSubmit}
            className="flex flex-1 flex-col gap-4 overflow-y-auto px-1 py-4"
          >
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="meal-name">Name *</Label>
              <Input
                id="meal-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Chicken Biryani"
                required
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meal-desc">Description</Label>
              <textarea
                id="meal-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description"
                rows={3}
                disabled={submitting}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meal-price">Price (৳) *</Label>
              <Input
                id="meal-price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                required
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meal-image">Image URL</Label>
              <Input
                id="meal-image"
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://..."
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meal-category">Category</Label>
              <Select
                value={categoryId || "none"}
                onValueChange={(v) => setCategoryId(v === "none" ? "" : v)}
                disabled={submitting}
              >
                <SelectTrigger id="meal-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {activeCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="meal-dietary">Dietary tags</Label>
              <Input
                id="meal-dietary"
                value={dietaryTagsStr}
                onChange={(e) => setDietaryTagsStr(e.target.value)}
                placeholder={DIETARY_PLACEHOLDER}
                disabled={submitting}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="meal-available"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                disabled={submitting}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="meal-available" className="cursor-pointer font-normal">
                Available for order
              </Label>
            </div>
          </form>
          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeSheet}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              form="meal-form"
              type="submit"
              disabled={submitting}
              className="gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isEditing ? "Updating…" : "Adding…"}
                </>
              ) : isEditing ? (
                "Update meal"
              ) : (
                "Add meal"
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
