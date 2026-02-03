"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Mail, ShieldCheck, ShieldOff, User } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { UserAdmin } from "@/types";
import type { UserStatus } from "@/types";
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

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      dateStyle: "medium",
    });
  } catch {
    return iso;
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setError(null);
    try {
      const res = await api<UserAdmin[]>("/api/admin/users");
      setUsers(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const setStatus = useCallback(
    async (id: string, status: UserStatus) => {
      setUpdatingId(id);
      try {
        await api(`/api/admin/users/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        });
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, status } : u))
        );
        toast.success(
          status === "ACTIVE" ? "User activated" : "User suspended",
          {
            description: `Status updated to ${status}.`,
          }
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Update failed";
        toast.error("Could not update user", { description: msg });
      } finally {
        setUpdatingId(null);
      }
    },
    []
  );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2
            className="h-10 w-10 animate-spin text-muted-foreground"
            aria-hidden
          />
          <p className="text-sm text-muted-foreground">Loading users…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="mt-1 text-muted-foreground">
          Manage user accounts. Suspend or activate access.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All users</CardTitle>
          <CardDescription>
            {users.length} user{users.length !== 1 ? "s" : ""} total. Use
            Suspend/Activate to change account status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground">
              No users found.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                    <th className="px-4 py-3 font-medium text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const isUpdating = updatingId === user.id;
                    const isActive = user.status === "ACTIVE";
                    return (
                      <tr
                        key={user.id}
                        className="border-b last:border-b-0 transition-colors hover:bg-muted/30"
                      >
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-2 font-medium">
                            <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                            {user.name ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4 shrink-0" />
                            {user.email}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="capitalize">
                            {user.role.toLowerCase()}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={isActive ? "default" : "destructive"}
                            className={!isActive ? "bg-muted-foreground/80" : ""}
                          >
                            {user.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isActive ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setStatus(user.id, "SUSPENDED")}
                              disabled={isUpdating}
                              className="gap-1.5 text-amber-700 hover:bg-amber-500/10 hover:text-amber-700 dark:text-amber-400"
                            >
                              {isUpdating ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <ShieldOff className="h-3.5 w-3.5" />
                              )}
                              Suspend
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setStatus(user.id, "ACTIVE")}
                              disabled={isUpdating}
                              className="gap-1.5 text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-400"
                            >
                              {isUpdating ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <ShieldCheck className="h-3.5 w-3.5" />
                              )}
                              Activate
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
