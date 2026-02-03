"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { useSession, authClient } from "@/lib/auth-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [name, setName] = useState("");
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isPending) return;
    if (!session) router.replace("/login");
  }, [isPending, session, router]);

  const user = session?.user;
  const currentInput = name || (user?.name ?? "");
  const savedName = user?.name ?? "";
  const isDirty = currentInput.trim() !== savedName.trim();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      if (!name.trim()) {
        setError("Name cannot be empty.");
        return;
      }
      setUpdating(true);
      try {
        const result = await authClient.updateUser({ name: name.trim() });
        if (result.error) {
          setError(result.error.message ?? "Failed to update profile");
          toast.error("Could not update name");
          return;
        }
        toast.success("Profile updated");
        setName("");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to update profile";
        setError(msg);
        toast.error("Could not update name");
      } finally {
        setUpdating(false);
      }
    },
    [name]
  );

  if (isPending || !session) {
    return (
      <main className="container max-w-2xl py-8 flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    );
  }

  return (
    <main className="container max-w-2xl py-8">
      <h1 className="text-2xl font-semibold mb-6 flex items-center gap-2">
        <User className="h-6 w-6" />
        Profile
      </h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your account details (read-only except name).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Email</Label>
            <p className="text-sm font-medium">{user?.email ?? "—"}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Name</Label>
            <p className="text-sm font-medium">{user?.name ?? "—"}</p>
          </div>
          {user?.role && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Role</Label>
              <p className="text-sm font-medium capitalize">{String(user.role).toLowerCase()}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Update name</CardTitle>
          <CardDescription>Change your display name. This will not change your email.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="profile-name">Name</Label>
              <Input
                id="profile-name"
                value={currentInput}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                disabled={updating}
              />
            </div>
            <Button type="submit" disabled={updating || !isDirty}>
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating…
                </>
              ) : (
                "Save name"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
