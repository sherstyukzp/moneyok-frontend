"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field";
import { AuthShell } from "@/components/auth-shell";
import { ShellLoading } from "@/components/shell-loading";
import { useAuth } from "@/lib/auth";

export default function SignupPage() {
  const { session, loading, signUp } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [checkEmail, setCheckEmail] = React.useState(false);

  React.useEffect(() => {
    if (!loading && session) {
      router.replace("/overview");
    }
  }, [loading, session, router]);

  const passwordValid = password.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;
    setError(null);
    setPending(true);
    const { session: signedIn, error: err } = await signUp(
      email.trim(),
      password,
      fullName.trim()
    );
    setPending(false);
    if (err) {
      setError(err);
      return;
    }
    if (signedIn) {
      router.replace("/overview");
    } else {
      setCheckEmail(true);
    }
  };

  if (loading) return <ShellLoading label="Перевірка сесії…" />;

  if (checkEmail) {
    return (
      <AuthShell
        title="Перевірте пошту"
        subtitle="Майже готово!"
        footer={
          <>
            Вже маєте акаунт?{" "}
            <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
              Увійти
            </Link>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Ми надіслали лист для підтвердження на <span className="font-medium text-foreground">{email}</span>.
          Підтвердіть реєстрацію та поверніться до входу.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Реєстрація"
      subtitle="Створіть акаунт, щоб почати бюджетування"
      footer={
        <>
          Вже маєте акаунт?{" "}
          <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
            Увійти
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field>
          <FieldLabel>Імʼя</FieldLabel>
          <FieldContent>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Як до вас звертатися"
              autoFocus
            />
          </FieldContent>
        </Field>
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Щонайменше 6 символів"
              required
            />
            {password.length > 0 && !passwordValid ? (
              <FieldError>Пароль має містити щонайменше 6 символів</FieldError>
            ) : null}
          </FieldContent>
        </Field>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" disabled={pending || !passwordValid}>
          {pending ? "Створення…" : "Створити акаунт"}
        </Button>
      </form>
      <p className="text-center text-xs text-muted-foreground">
        Після реєстрації автоматично створюється книга «Personal».
      </p>
    </AuthShell>
  );
}