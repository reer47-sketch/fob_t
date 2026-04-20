"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RotateCcw } from "lucide-react";

interface StatsFiltersProps {
  yearFrom: number;
  monthFrom: number;
  yearTo: number;
  monthTo: number;
  onYearFromChange: (value: number) => void;
  onMonthFromChange: (value: number) => void;
  onYearToChange: (value: number) => void;
  onMonthToChange: (value: number) => void;
}

const toMonthValue = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, "0")}`;

const parseMonthValue = (value: string): { year: number; month: number } | null => {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) };
};

export function StatsFilters({
  yearFrom,
  monthFrom,
  yearTo,
  monthTo,
  onYearFromChange,
  onMonthFromChange,
  onYearToChange,
  onMonthToChange,
}: StatsFiltersProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const minMonth = "2020-01";
  const maxMonth = toMonthValue(currentYear, 12);

  const fromValue = toMonthValue(yearFrom, monthFrom);
  const toValue = toMonthValue(yearTo, monthTo);

  const handleFromChange = (value: string) => {
    const parsed = parseMonthValue(value);
    if (!parsed) return;
    onYearFromChange(parsed.year);
    onMonthFromChange(parsed.month);
  };

  const handleToChange = (value: string) => {
    const parsed = parseMonthValue(value);
    if (!parsed) return;
    onYearToChange(parsed.year);
    onMonthToChange(parsed.month);
  };

  const handleReset = () => {
    onYearFromChange(currentYear);
    onMonthFromChange(1);
    onYearToChange(currentYear);
    onMonthToChange(currentMonth);
  };

  return (
    <div className="flex items-center gap-2 w-full lg:w-auto lg:gap-3">
      <Input
        type="month"
        value={fromValue}
        onChange={(e) => handleFromChange(e.target.value)}
        min={minMonth}
        max={maxMonth}
        className="w-[150px] lg:w-[160px]"
      />
      <span className="text-muted-foreground shrink-0">~</span>
      <Input
        type="month"
        value={toValue}
        onChange={(e) => handleToChange(e.target.value)}
        min={minMonth}
        max={maxMonth}
        className="w-[150px] lg:w-[160px]"
      />
      <Button
        onClick={handleReset}
        variant="outline"
        size="icon"
        aria-label="기간 초기화"
        className="shrink-0 ml-auto lg:ml-1"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
}
