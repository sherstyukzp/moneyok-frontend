import type { Transaction } from "@/lib/types";
import { isSameMonth } from "@/lib/format";

export function computeBudgetSpent(
  transactions: Transaction[],
  bookId: string | null,
  categoryId: string,
  refDate: Date
): number {
  return transactions.reduce((sum, tx) => {
    if (
      tx.budget_book_id === bookId &&
      tx.type === "expense" &&
      tx.category_id === categoryId &&
      isSameMonth(tx.transaction_date, refDate)
    ) {
      return sum + tx.amount;
    }
    return sum;
  }, 0);
}