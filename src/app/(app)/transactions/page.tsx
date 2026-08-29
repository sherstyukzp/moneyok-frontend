import { Suspense } from "react";
import { TransactionsView } from "./transactions-view";

export const metadata = { title: "Транзакції" };

export default function TransactionsPage() {
  return (
    <Suspense
      fallback={
        <p className="py-10 text-center text-sm text-muted-foreground">
          Завантаження транзакцій…
        </p>
      }
    >
      <TransactionsView />
    </Suspense>
  );
}