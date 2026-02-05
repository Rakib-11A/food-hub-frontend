const BASE = process.env.NEXT_PUBLIC_API_URL;

function getBaseUrl(): string {
  const url = typeof BASE === "string" ? BASE.trim() : "";
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not set. Add it in Vercel (Environment Variables) and redeploy."
    );
  }
  return url.replace(/\/$/, ""); // no trailing slash
}

export async function api<T>(
  path: string,
  options?: RequestInit
): Promise<{ data?: T; success?: boolean; message?: string }> {
  const base = getBaseUrl();
  const url = path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || res.statusText);
  return json;
}