"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Status = "idle" | "loading" | "success" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<{
    status: Status;
    message: string | null;
  }>({ status: "loading", message: null });
  const { status, message } = state;

  useEffect(() => {
    if (!API_URL || !token?.trim() || status !== "loading") return;
    let cancelled = false;

    const verify = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`,
          { credentials: "include", method: "GET" }
        );

        const data = await res.json().catch(() => ({}));

        if (cancelled) return;

        if (!res.ok) {
          const errMsg =
            (data as { message?: string }).message ||
            "Invalid or expired link. Please request a new verification email.";
          setState({ status: "error", message: errMsg });
          toast.error("Verification failed", { description: errMsg });
          return;
        }

        setState({ status: "success", message: null });
        toast.success("Email verified", {
          description: "You can now sign in to your account.",
        });
      } catch {
        if (cancelled) return;
        const errMsg =
          "Something went wrong. Please check your connection and try again.";
        setState({ status: "error", message: errMsg });
        toast.error("Verification failed", { description: errMsg });
      }
    };

    verify();
    return () => {
      cancelled = true;
    };
  }, [token, status]);

  // Renders: after all hooks so hooks are never conditional
  if (!API_URL) {
    return (
      <ErrorCard
        title="Configuration error"
        message="Please try again later."
      />
    );
  }
  if (!token || token.trim() === "") {
    return (
      <ErrorCard
        title="Verification failed"
        message="Invalid or expired link. No verification token found."
      />
    );
  }

  if (status === "loading" || status === "idle") {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Verifying your email</CardTitle>
            <CardDescription>
              Please wait while we confirm your email address…
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-4">
              <div
                className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
                aria-hidden
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Email verified</CardTitle>
            <CardDescription>
              Your email has been verified. You can now sign in to your account.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/login">Go to login</Link>
            </Button>
            <Button variant="ghost" asChild className="w-full">
              <Link href="/">Back to home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <ErrorCard
      title="Verification failed"
      message={
        message ??
        "Invalid or expired link. Please request a new verification email from the sign-up or login page."
      }
    />
  );
}

function ErrorCard({
  title,
  message,
}: { title: string; message: string }) {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link href="/login">Go to login</Link>
          </Button>
          <Button variant="ghost" asChild className="w-full">
            <Link href="/register">Create an account</Link>
          </Button>
          <Button variant="ghost" asChild className="w-full">
            <Link href="/">Back to home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[80vh] items-center justify-center px-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Verifying your email</CardTitle>
              <CardDescription>Please wait…</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center py-4">
                <div
                  className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
                  aria-hidden
                />
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
