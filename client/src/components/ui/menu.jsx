import { useState } from "react";
import { CategoryIcon } from "@/components/ui/category";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/utils";

// `modal` keeps the list scrollable when the picker opens inside a side panel.
export const CategoryPicker = ({ value, onChange, label, children, triggerClassName, modal }) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={modal}>
      <PopoverTrigger aria-label={label} onClick={(e) => e.stopPropagation()} className={triggerClassName}>
        {children}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        onClick={(e) => e.stopPropagation()}
        className="grid max-h-80 w-[min(21rem,calc(100vw-2rem))] grid-cols-2 gap-0.5 overflow-y-auto p-1.5"
      >
        {EXPENSE_CATEGORIES.map((category) => (
          <button
            key={category.value}
            type="button"
            aria-pressed={category.value === value}
            onClick={() => {
              onChange(category.value);
              setOpen(false);
            }}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium hover:bg-muted",
              category.value === value && "bg-accent"
            )}
          >
            <CategoryIcon category={category.value} />
            <span className="line-clamp-2">{category.label}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
};
