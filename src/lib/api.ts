const BASE = process.env.NEXT_PUBLIC_API_URL;

export async function api<T>(
  path: string,
  options?: RequestInit
): Promise<{ data?: T; success?: boolean; message?: string }> {
  const res = await fetch(`${BASE}${path}`, {
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