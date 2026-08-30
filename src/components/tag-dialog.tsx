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

import { COLOR_OPTIONS } from "@/components/category-looks";
import { useData } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";
import type { Tag } from "@/lib/types";

export type TagDialogMode = "create" | "edit";

export function TagDialog({
  mode,
  tag,
  trigger,
  open,
  onOpenChange,
}: {
  mode: TagDialogMode;
  tag?: Tag;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { addTag, updateTag } = useData();
  const { text } = useLanguage();
  const [internalOpen, setInternalOpen] = React.useState(false);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = (next: boolean) =>
    isControlled ? onOpenChange?.(next) : setInternalOpen(next);

  const isEdit = mode === "edit";

  const [name, setName] = React.useState(tag?.name ?? "");
  const [color, setColor] = React.useState(tag?.color ?? COLOR_OPTIONS[0]);
  const [submitting, setSubmitting] = React.useState(false);

  const canSave = name.trim().length > 0 && !submitting;

  const handleSave = async () => {
    if (!canSave) return;
    setSubmitting(true);
    try {
      if (isEdit) {
        await updateTag(tag!.id, { name: name.trim(), color });
        toast.success(text("Tag updated", "Тег оновлено"));
      } else {
        await addTag({ name: name.trim(), color });
        toast.success(text("Tag added", "Тег додано"));
      }
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
    ? text("Rename tag", "Перейменувати тег")
    : text("New tag", "Новий тег");

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {text(
              "Tags help group transactions across accounts.",
              "Теги допомагають групувати операції на різних рахунках."
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel>{text("Name", "Назва")}</FieldLabel>
            <FieldContent>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                }}
                placeholder={text("Tag name", "Назва тегу")}
                autoFocus
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>{text("Color", "Колір")}</FieldLabel>
            <FieldContent>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={c}
                    onClick={() => setColor(c)}
                    className={`size-6 rounded-full border border-black/10 transition-transform outline-none focus-visible:ring-2 focus-visible:ring-ring ${color === c ? "scale-110 ring-2 ring-ring ring-offset-2 ring-offset-background" : "hover:scale-110"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </FieldContent>
          </Field>
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