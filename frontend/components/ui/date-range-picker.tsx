import React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  months?: number;
  disabledDays?: (date: Date) => boolean;
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  months = 2,
  disabledDays,
  className = "",
}) => {
  return (
    <Card glass className={cn("p-4 w-fit", className)}>
      <DayPicker
        mode="range"
        selected={value}
        onSelect={onChange}
        numberOfMonths={months}
        disabled={disabledDays}
        className="bg-transparent"
        classNames={{
          months: "flex gap-4",
          month: "bg-white/60 dark:bg-gray-900/60 rounded-xl p-2 shadow-md backdrop-blur-md",
          day_selected: "bg-primary text-white",
          day_range_middle: "bg-primary/20",
          day_today: "border border-primary",
        }}
        showOutsideDays
      />
    </Card>
  );
}; 