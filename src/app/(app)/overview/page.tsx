import { Suspense } from "react";
import { OverviewView } from "./overview-view";

export const metadata = { title: "Огляд" };

export default function OverviewPage() {
  return (
    <Suspense
      fallback={
        <p className="py-10 text-center text-sm text-muted-foreground">
          Завантаження огляду…
        </p>
      }
    >
      <OverviewView />
    </Suspense>
  );
}