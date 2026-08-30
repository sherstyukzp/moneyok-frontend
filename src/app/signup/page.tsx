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
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";

export default function SignupPage() {
  const { session, loading, signUp } = useAuth();
  const { text } = useLanguage();
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
      toast.error(err);
      return;
    }
    if (signedIn) {
      toast.success(text("Account created", "Акаунт створено"));
      router.replace("/overview");
    } else {
      toast.success(
        text("Check your email to confirm", "Перевірте пошту для підтвердження")
      );
      setCheckEmail(true);
    }
  };

  if (loading) return <ShellLoading label={text("Checking session...", "Перевірка сесії…")} />;

  if (checkEmail) {
    return (
      <AuthShell
        title={text("Check your email", "Перевірте пошту")}
        subtitle={text("Almost there!", "Майже готово!")}
        footer={
          <>
            {text("Already have an account?", "Вже маєте акаунт?")}{" "}
            <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
              {text("Log in", "Увійти")}
            </Link>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          {text("We sent a confirmation email to", "Ми надіслали лист для підтвердження на")} {" "}
          <span className="font-medium text-foreground">{email}</span>. {" "}
          {text(
            "Confirm your registration and return to the login page.",
            "Підтвердіть реєстрацію та поверніться до входу."
          )}
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={text("Sign up", "Реєстрація")}
      subtitle={text("Create an account to start budgeting", "Створіть акаунт, щоб почати бюджетування")}
      footer={
        <>
          {text("Already have an account?", "Вже маєте акаунт?")}{" "}
          <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
            {text("Log in", "Увійти")}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field>
          <FieldLabel>{text("Name", "Імʼя")}</FieldLabel>
          <FieldContent>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={text("What should we call you?", "Як до вас звертатися")}
              autoFocus
            />
          </FieldContent>
        </Field>
        <Field>
          <FieldLabel>{text("Email", "Електронна пошта")}</FieldLabel>
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
          <FieldLabel>{text("Password", "Пароль")}</FieldLabel>
          <FieldContent>
            <Input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={text("At least 6 characters", "Щонайменше 6 символів")}
              required
            />
            {password.length > 0 && !passwordValid ? (
              <FieldError>
                {text("Password must be at least 6 characters", "Пароль має містити щонайменше 6 символів")}
              </FieldError>
            ) : null}
          </FieldContent>
        </Field>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" disabled={pending || !passwordValid}>
          {pending ? text("Creating...", "Створення…") : text("Create account", "Створити акаунт")}
        </Button>
      </form>
      <p className="text-center text-xs text-muted-foreground">
        {text(
          'A "Personal" book is created automatically after registration.',
          "Після реєстрації автоматично створюється книга «Personal»."
        )}
      </p>
    </AuthShell>
  );
}
