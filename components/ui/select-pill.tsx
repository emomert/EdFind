"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export type SelectPillOption = { value: string; label: string };

/**
 * Styled replacement for the native <select> used across filter bars. The
 * native dropdown menu is OS-rendered (sharp corners, no animation), which
 * clashed with the site's rounded design language — this renders a custom
 * panel instead (rounded, shadowed, scale-fade entrance, ↑↓/Enter/Esc keys).
 */
export function SelectPill({
  value,
  onChange,
  options,
  placeholder,
  prefix,
  className,
  panelClassName,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  /** Include an explicit { value: "", label: "All …" } entry for the reset row. */
  options: SelectPillOption[];
  /** Trigger label when value is "" and no matching option exists. */
  placeholder?: string;
  /** Static prefix shown before the selected label (e.g. "Sort:"). */
  prefix?: string;
  className?: string;
  panelClassName?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const t = useTranslations("common.selectPill");

  const selected = options.find((o) => o.value === value);
  const triggerLabel = selected?.label ?? placeholder ?? t("placeholder");

  // Close on outside click / Esc.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Keep the active row visible while arrowing through long lists.
  useEffect(() => {
    if (!open) return;
    const node = listRef.current?.children[activeIndex] as
      | HTMLElement
      | undefined;
    node?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  const openPanel = () => {
    const idx = options.findIndex((o) => o.value === value);
    setActiveIndex(idx >= 0 ? idx : 0);
    setOpen(true);
  };

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      openPanel();
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = options[activeIndex];
      if (opt) pick(opt.value);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPanel())}
        onKeyDown={onTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={ariaLabel}
        className={cn(
          "inline-flex w-full items-center justify-between gap-1.5 rounded-full border bg-white px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-teal-100",
          open
            ? "border-teal-400 ring-2 ring-teal-100"
            : "border-slate-200 hover:border-slate-300 focus:border-teal-500",
        )}
      >
        <span className="truncate text-left">
          {prefix && <span className="text-slate-400">{prefix} </span>}
          <span className={selected && selected.value !== "" ? "text-slate-800" : "text-slate-600"}>
            {triggerLabel}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-slate-400 transition-transform duration-200",
            open && "rotate-180 text-teal-600",
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.21, 0.6, 0.3, 1] }}
            className={cn(
              "absolute left-0 top-[calc(100%+6px)] z-40 min-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl",
              panelClassName,
            )}
          >
            <div
              ref={listRef}
              id={listboxId}
              role="listbox"
              className="max-h-64 overflow-y-auto p-1.5"
            >
              {options.map((o, i) => {
                const isSelected = o.value === value;
                return (
                  <button
                    key={o.value || "__all__"}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => pick(o.value)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                      i === activeIndex ? "bg-teal-50 text-teal-800" : "text-slate-700",
                    )}
                  >
                    <span className="truncate">{o.label}</span>
                    {isSelected && <Check className="size-3.5 shrink-0 text-teal-600" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
