"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { useAuth } from "@/features/auth/AuthProvider";
import { getErrorMessage } from "@/utils/errors";
import { Notice } from "./PageHeader";

export function LoginForm() {
  const { login, status } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const requested = params.get("next") ?? "";
  const next = requested.startsWith("/admin") && !requested.startsWith("//") ? requested : "/admin";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace(next);
  }, [status, next, router]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!username.trim() || !password) {
      setError("Enter your username and password.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(getErrorMessage(err, "Sign in failed."));
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="glass brackets w-full max-w-md rounded-2xl p-8 shadow-card">
        <Logo />
        <h1 className="mt-8 font-display text-2xl font-semibold text-white">Administrator sign in</h1>
        <p className="mt-1 text-sm text-silver-400">Access is limited to authorised staff.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          {error && <Notice tone="error">{error}</Notice>}
          <Field label="Username" htmlFor="username">
            <Input id="username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
          </Field>
          <Field label="Password" htmlFor="password">
            <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Button type="submit" loading={submitting} className="w-full">
            Sign in
          </Button>
        </form>
      </div>
    </main>
  );
}
