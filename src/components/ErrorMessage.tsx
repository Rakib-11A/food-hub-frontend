"use client";

import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export type ErrorMessageVariant = "error" | "404" | "403";

interface ErrorMessageProps {
  message: string;
  variant?: ErrorMessageVariant;
  linkTo?: string;
  linkLabel?: string;
  className?: string;
}

const variantConfig: Record<
  ErrorMessageVariant,
  { title: string; defaultLinkTo: string; defaultLinkLabel: string }
> = {
  error: {
    title: "Error",
    defaultLinkTo: "",
    defaultLinkLabel: "",
  },
  "404": {
    title: "Not found",
    defaultLinkTo: "/",
    defaultLinkLabel: "Go back",
  },
  "403": {
    title: "You don't have permission",
    defaultLinkTo: "/",
    defaultLinkLabel: "Back to home",
  },
};

/**
 * Infer ErrorMessage variant from a caught API error (e.g. 404 → "404", 403 → "403").
 */
export function getErrorMessageVariant(err: unknown): ErrorMessageVariant {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  if (msg.includes("404") || lower.includes("not found")) return "404";
  if (
    msg.includes("403") ||
    lower.includes("forbidden") ||
    lower.includes("permission")
  )
    return "403";
  return "error";
}

/**
 * Displays API or auth errors. Use above forms or in place of content.
 * For 404: show "Not found" and link back. For 403: show permission message and link to home/login.
 */
export function ErrorMessage({
  message,
  variant = "error",
  linkTo,
  linkLabel,
  className,
}: ErrorMessageProps) {
  const config = variantConfig[variant];
  const href = linkTo ?? config.defaultLinkTo;
  const label = linkLabel ?? config.defaultLinkLabel;

  return (
    <Alert variant="destructive" className={className}>
      <AlertTitle>{config.title}</AlertTitle>
      <AlertDescription className="mt-1 flex flex-col gap-2">
        <span>{message}</span>
        {href && label && (
          <Button variant="outline" size="sm" asChild className="w-fit">
            <Link href={href}>{label}</Link>
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
