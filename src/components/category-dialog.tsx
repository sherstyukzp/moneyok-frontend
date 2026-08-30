"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldContent,
  FieldLabel,
} from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { IconColorPicker } from "@/components/category-looks";
import { useData } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";
import type { Category } from "@/lib/types";

export type CategoryDialogMode = "create-parent" | "create-child" | "edit";

export function CategoryDialog({
  mode,
  category,
  parentId,
  trigger,
  open,
  onOpenChange,
}: {
  mode: CategoryDialogMode;
  category?: Category;
  parentId?: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { addCategory, updateCategory, categories, activeBookId } = useData();
  const { text } = useLanguage();
  const [internalOpen, setInternalOpen] = React.useState(false);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = (next: boolean) =>
    isControlled ? onOpenChange?.(next) : setInternalOpen(next);

  const isEdit = mode === "edit";
  const isChild = isEdit ? !!category?.parent_id : mode === "create-child";

  const [name, setName] = React.useState(category?.name ?? "");
  const [parent, setParent] = React.useState(
    isEdit ? (category?.parent_id ?? "") : (parentId ?? "")
  );
  const [icon, setIcon] = React.useState(category?.icon ?? "cart");
  const [color, setColor] = React.useState(category?.color ?? "#f59e0b");
  const [submitting, setSubmitting] = React.useState(false);

  const parentCategories = React.useMemo(
    () =>
      categories.filter(
        (c) => c.budget_book_id === activeBookId && c.parent_id == null
      ),
    [categories, activeBookId]
  );

  const canSave =
    name.trim().length > 0 && (isChild ? parent.length > 0 : true) && !submitting;

  const handleSave = async () => {
    if (!canSave) return;
    setSubmitting(true);
    try {
      if (isEdit) {
        await updateCategory(
          category!.id,
          isChild
            ? { name: name.trim(), icon, color }
            : { name: name.trim() }
        );
        toast.success(
          isChild
            ? text("Subcategory updated", "Підкатегорію оновлено")
            : text("Folder updated", "Папку оновлено")
        );
      } else if (isChild) {
        await addCategory({
          name: name.trim(),
          parent_id: parent,
          icon,
          color,
        });
        toast.success(text("Subcategory added", "Підкатегорію додано"));
      } else {
        await addCategory({ name: name.trim() });
        toast.success(text("Folder added", "Папку додано"));
      }
      setName("");
      setParent(parentId ?? "");
      setIcon("cart");
      setColor("#f59e0b");
      setOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : text("Save error", "Помилка збереження")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const title = isEdit
    ? isChild
      ? text("Edit subcategory", "Редагувати підкатегорію")
      : text("Edit folder", "Редагувати папку")
    : isChild
      ? text("New subcategory", "Нова підкатегорія")
      : text("New folder", "Нова папка");

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isChild
              ? text(
                  "A subcategory belongs to a folder.",
                  "Підкатегорія привʼязується до папки."
                )
              : text(
                  "A folder groups subcategories.",
                  "Папка групує підкатегорії."
                )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {isChild && !isEdit ? (
            <Field>
              <FieldLabel>{text("Parent folder", "Батьківська папка")}</FieldLabel>
              <FieldContent>
                <Select value={parent} onValueChange={setParent}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={text("Select a folder", "Оберіть папку")} />
                  </SelectTrigger>
                  <SelectContent>
                    {parentCategories.length === 0 ? (
                      <p className="px-2 py-3 text-sm text-muted-foreground">
                        {text(
                          "Create a folder first.",
                          "Спочатку створіть папку."
                        )}
                      </p>
                    ) : (
                      parentCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
          ) : null}

          {isEdit && isChild ? (
            <p className="text-sm text-muted-foreground">
              {text("Folder:", "Папка:")}{" "}
              <span className="font-medium text-foreground">
                {parentCategories.find((c) => c.id === category?.parent_id)?.name ?? "—"}
              </span>
            </p>
          ) : null}

          <Field>
            <FieldLabel>{text("Name", "Назва")}</FieldLabel>
            <FieldContent>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                }}
                placeholder={
                  isChild
                    ? text("For example, Groceries", "Наприклад, Продукти")
                    : text("For example, Food and drinks", "Наприклад, Їжа та напої")
                }
                autoFocus
              />
            </FieldContent>
          </Field>

          {isChild ? (
            <Field>
              <FieldLabel>{text("Icon and color", "Іконка та колір")}</FieldLabel>
              <FieldContent>
                <IconColorPicker
                  icon={icon}
                  color={color}
                  onChange={(i, c) => {
                    setIcon(i);
                    setColor(c);
                  }}
                />
              </FieldContent>
            </Field>
          ) : null}
        </div>
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            {text("Cancel", "Скасувати")}
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {submitting
              ? text("Saving...", "Збереження…")
              : isEdit
                ? text("Save", "Зберегти")
                : text("Add", "Додати")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
