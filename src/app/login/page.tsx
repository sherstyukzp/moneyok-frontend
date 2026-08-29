"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { AuthShell } from "@/components/auth-shell";
import { ShellLoading } from "@/components/shell-loading";
import { useAuth } from "@/lib/auth";

const DEMO_EMAIL = "demo@moneyok.local";
const DEMO_PASSWORD = "demo-password";

export default function LoginPage() {
  const { session, loading, signIn } = useAuth();
  const router = useRouter();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!loading && session) {
      router.replace("/overview");
    }
  }, [loading, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    const err = await signIn(email.trim(), password);
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    router.replace("/overview");
  };

  const handleDemo = async () => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    const err = await signIn(DEMO_EMAIL, DEMO_PASSWORD);
    setSubmitting(false);
    if (err) setError(err);
  };

  if (loading) return <ShellLoading label="Перевірка сесії…" />;

  return (
    <AuthShell
      title="Вхід"
      subtitle="Ваші особисті фінанси в одному місці"
      footer={
        <>
          Немає акаунта?{" "}
          <Link href="/signup" className="font-medium text-foreground underline underline-offset-4">
            Зареєструватися
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field>
          <FieldLabel>Email</FieldLabel>
          <FieldContent>
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </FieldContent>
        </Field>
        <Field>
          <FieldLabel>Пароль</FieldLabel>
          <FieldContent>
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </FieldContent>
        </Field>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Вхід…" : "Увійти"}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">або</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button variant="outline" onClick={handleDemo} disabled={submitting}>
        <Sparkles />
        Увійти як демо-користувач
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        {DEMO_EMAIL} · {DEMO_PASSWORD}
      </p>
    </AuthShell>
  );
}