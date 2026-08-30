import { Suspense } from "react";
import { SettingsView } from "./settings-view";

export const metadata = { title: "Налаштування" };

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <p className="py-16 text-center text-sm text-muted-foreground">
          Завантаження налаштувань…
        </p>
      }
    >
      <SettingsView />
    </Suspense>
  );
}