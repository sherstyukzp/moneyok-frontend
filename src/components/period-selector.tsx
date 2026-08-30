"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/lib/i18n";
import {
  DEFAULT_PERIOD,
  isPeriodKey,
  PERIOD_KEYS,
  type PeriodKey,
} from "@/lib/period";

const LABELS: Record<PeriodKey, [string, string]> = {
  "7d": ["7 days", "7 днів"],
  "30d": ["30 days", "30 днів"],
  "90d": ["90 days", "90 днів"],
  year: ["Year", "Рік"],
};

export function PeriodSelector({
  value,
  onChange,
  className,
}: {
  value: PeriodKey;
  onChange: (period: PeriodKey) => void;
  className?: string;
}) {
  const { text } = useLanguage();
  return (
    <Tabs
      value={value}
      onValueChange={(v) => {
        if (isPeriodKey(v)) onChange(v);
      }}
      className={className}
    >
      <TabsList>
        {PERIOD_KEYS.map((key) => (
          <TabsTrigger key={key} value={key}>
            {text(...LABELS[key])}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

export function parsePeriodParam(raw: string | null | undefined): PeriodKey {
  return isPeriodKey(raw) ? raw : DEFAULT_PERIOD;
}