"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Category } from "@/types";
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

function slugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [isActive, setIsActive] = useState(true);

  const isEditing = editingCategory != null;

  const loadCategories = useCallback(async () => {
    setError(null);
    try {
      const res = await api<Category[]>("/api/categories");
      setCategories(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const resetForm = useCallback(() => {
    setName("");
    setSlug("");
    setDescription("");
    setImage("");
    setIsActive(true);
    setEditingCategory(null);
    setFormError(null);
  }, []);

  const openCreate = useCallback(() => {
    resetForm();
    setSheetOpen(true);
  }, [resetForm]);

  const openEdit = useCallback((category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setSlug(category.slug ?? slugFromName(category.name));
    setDescription(category.description ?? "");
    setImage(category.image ?? "");
    setIsActive(category.isActive);
    setFormError(null);
    setSheetOpen(true);
  }, []);

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    resetForm();
  }, [resetForm]);

  const handleNameChange = useCallback((value: string) => {
    setName(value);
    setSlug((prev) =>
      prev === slugFromName(name) ? slugFromName(value) : prev
    );
  }, [name]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFormError(null);
      const trimmedName = name.trim();
      if (!trimmedName) {
        setFormError("Name is required.");
        return;
      }
      const body = {
        name: trimmedName,
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
        image: image.trim() || undefined,
        isActive,
      };

      setSubmitting(true);
      try {
        if (isEditing && editingCategory) {
          await api(`/api/categories/${editingCategory.id}`, {
            method: "PUT",
            body: JSON.stringify(body),
          });
          toast.success("Category updated");
        } else {
          await api("/api/categories", {
            method: "POST",
            body: JSON.stringify(body),
          });
          toast.success("Category created");
        }
        closeSheet();
        await loadCategories();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Request failed";
        setFormError(msg);
        toast.error(isEditing ? "Update failed" : "Create failed", {
          description: msg,
        });
      } finally {
        setSubmitting(false);
      }
    },
    [
      name,
      slug,
      description,
      image,
      isActive,
      isEditing,
      editingCategory,
      closeSheet,
      loadCategories,
    ]
  );

  const handleDelete = useCallback(
    async (category: Category) => {
      if (
        !window.confirm(
          `Delete "${category.name}"? This cannot be undone.`
        )
      )
        return;
      setDeletingId(category.id);
      try {
        await api(`/api/categories/${category.id}`, { method: "DELETE" });
        toast.success("Category deleted");
        await loadCategories();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Delete failed";
        toast.error("Delete failed", { description: msg });
      } finally {
        setDeletingId(null);
      }
    },
    [loadCategories]
  );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2
            className="h-10 w-10 animate-spin text-muted-foreground"
            aria-hidden
          />
          <p className="text-sm text-muted-foreground">
            Loading categories…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="mt-1 text-muted-foreground">
            Manage meal categories. Create, edit, or remove.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 sm:shrink-0">
          <Plus className="h-4 w-4" />
          Add category
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!error && categories.length === 0 ? (
        <Card className="overflow-hidden border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4">
              <UtensilsCrossed className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="mt-4 text-xl font-semibold">No categories</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Add categories to organize meals (e.g. Breakfast, Lunch, Drinks).
            </p>
            <Button onClick={openCreate} className="mt-6 gap-2">
              <Plus className="h-4 w-4" />
              Add category
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card
              key={category.id}
              className="flex flex-col overflow-hidden transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-video w-full shrink-0 bg-muted">
                {category.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={category.image}
                    alt={category.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-10 w-10" />
                  </div>
                )}
                <div className="absolute right-2 top-2">
                  <Badge
                    variant={category.isActive ? "default" : "secondary"}
                    className={cn(
                      !category.isActive &&
                        "bg-muted-foreground/80 text-muted"
                    )}
                  >
                    {category.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              <CardHeader className="flex-1 pb-2">
                <CardTitle className="line-clamp-1 text-lg">
                  {category.name}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {category.description ?? "No description"}
                </CardDescription>
                {category.slug && (
                  <p className="pt-1 text-xs text-muted-foreground">
                    /{category.slug}
                  </p>
                )}
              </CardHeader>
              <CardContent className="flex gap-2 border-t pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEdit(category)}
                  className="gap-1"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(category)}
                  disabled={deletingId === category.id}
                  className="gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  {deletingId === category.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  Delete
                </Button>
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
            <SheetTitle>
              {isEditing ? "Edit category" : "Add category"}
            </SheetTitle>
            <SheetDescription>
              {isEditing
                ? "Update the category details below."
                : "Fill in the details for the new category."}
            </SheetDescription>
          </SheetHeader>
          <form
            id="category-form"
            onSubmit={handleSubmit}
            className="flex flex-1 flex-col gap-4 overflow-y-auto px-1 py-4"
          >
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="cat-name">Name *</Label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Breakfast"
                required
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-slug">Slug</Label>
              <Input
                id="cat-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. breakfast"
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-desc">Description</Label>
              <textarea
                id="cat-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description"
                rows={3}
                disabled={submitting}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-image">Image URL</Label>
              <Input
                id="cat-image"
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://..."
                disabled={submitting}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="cat-active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={submitting}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="cat-active" className="cursor-pointer font-normal">
                Active (visible to users)
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
              form="category-form"
              type="submit"
              disabled={submitting}
              className="gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isEditing ? "Updating…" : "Creating…"}
                </>
              ) : isEditing ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
