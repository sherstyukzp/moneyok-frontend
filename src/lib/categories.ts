import type { Category, CategoryKind } from "@/lib/types";

export type CategoryTreeNode = Category & { children: Category[] };

export function buildCategoryTree(
  categories: Category[],
  bookId: string | null
): CategoryTreeNode[] {
  const book = categories.filter((c) => c.budget_book_id === bookId);
  const childrenByParent = new Map<string, Category[]>();
  for (const c of book) {
    if (c.parent_id) {
      const list = childrenByParent.get(c.parent_id) ?? [];
      list.push(c);
      childrenByParent.set(c.parent_id, list);
    }
  }
  return book
    .filter((c) => !c.parent_id)
    .map((c) => ({
      ...c,
      children: (childrenByParent.get(c.id) ?? []).sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function isLeaf(category: Pick<Category, "parent_id"> | null | undefined): boolean {
  return !!category?.parent_id;
}

export function leafCategories(
  categories: Category[],
  bookId: string | null,
  kind?: CategoryKind
): Category[] {
  return categories.filter(
    (c) =>
      c.budget_book_id === bookId && c.parent_id != null && (!kind || c.kind === kind)
  );
}

export function countCategoryUsage(
  transactions: { category_id: string | null }[]
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const tx of transactions) {
    if (!tx.category_id) continue;
    counts.set(tx.category_id, (counts.get(tx.category_id) ?? 0) + 1);
  }
  return counts;
}