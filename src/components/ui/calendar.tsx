import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4", className)}
      classNames={{
        months: "flex flex-col gap-4 sm:flex-row sm:gap-5",
        month: "space-y-4",
        caption: "relative flex items-center justify-center rounded-xl bg-muted/55 py-2",
        caption_label: "text-sm font-semibold tracking-wide text-foreground",
        nav: "absolute inset-x-2 top-1/2 flex -translate-y-1/2 items-center justify-between",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 rounded-lg border-border/70 bg-card/85 p-0 text-foreground shadow-soft hover:bg-card",
        ),
        nav_button_previous: "relative left-0",
        nav_button_next: "relative right-0",
        table: "w-full border-collapse",
        head_row: "flex gap-1",
        head_cell: "h-9 w-9 rounded-md text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground",
        row: "mt-1 flex w-full gap-1",
        cell: "relative h-9 w-9 p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected])]:bg-secondary/15 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 rounded-md p-0 font-medium text-foreground transition-colors hover:bg-muted aria-selected:opacity-100",
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary/95 hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "border border-secondary text-secondary",
        day_outside:
          "day-outside text-muted-foreground/55 aria-selected:bg-secondary/10 aria-selected:text-muted-foreground/70",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-secondary/20 aria-selected:text-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
