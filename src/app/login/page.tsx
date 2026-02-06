"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { UserRole } from "@/types";

function getRedirectForRole(role: UserRole, callbackUrl: string | null): string {
  if (callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")) {
    if (role === "PROVIDER" && callbackUrl === "/provider/profile") return callbackUrl;
    if (role === "ADMIN" && callbackUrl.startsWith("/admin")) return callbackUrl;
    if (role === "CUSTOMER" && !callbackUrl.startsWith("/admin") && !callbackUrl.startsWith("/provider")) return callbackUrl;
  }
  if (role === "ADMIN") return "/admin";
  if (role === "PROVIDER") return "/provider/dashboard";
  return "/";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await authClient.signIn.email({
        email: email.trim().toLowerCase(),
        password,
      });

      if (result.error) {
        const msg = result.error.message ?? "Sign in failed";
        setError(msg);
        toast.error("Sign in failed", { description: msg });
        setLoading(false);
        return;
      }

      const user = result.data?.user as { role?: UserRole } | undefined;
      const role = user?.role ?? "CUSTOMER";
      router.push(getRedirectForRole(role, callbackUrl));
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      toast.error("Sign in failed", { description: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-10 md:py-16">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1.5 pb-2">
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>
            Enter your email and password to access your account.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 pt-2">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={loading}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={loading}
                className="bg-background"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-5 border-t pt-6">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Don’t have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Register
              </Link>
            </p>
            <p className="text-center text-sm text-muted-foreground">
              Are you a provider?{" "}
              <Link
                href="/provider/profile"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Create your business profile
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[80vh] items-center justify-center">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
