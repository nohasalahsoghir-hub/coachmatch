"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, Plus, Search, X } from "lucide-react";

interface Props {
  options: string[];
  selected: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  allowCustom?: boolean;
  maxItems?: number;
  label?: string;
  badgeColor?: string;
}

// Arabic normalization helper to match alef, yaa, taa marbouta regardless of spelling variations
function normalizeAr(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\u064B-\u065F]/g, ""); // remove harakat/tashkeel
}

export function SearchableCombobox({
  options,
  selected,
  onChange,
  placeholder = "ابحث أو اكتب...",
  allowCustom = true,
  maxItems = 10,
  label,
  badgeColor = "var(--cobalt)",
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const normalizedQuery = useMemo(() => normalizeAr(query), [query]);

  // Filter options based on typed letters
  const filteredOptions = useMemo(() => {
    if (!normalizedQuery) return options.filter((opt) => !selected.includes(opt));

    return options.filter((opt) => {
      const normOpt = normalizeAr(opt);
      return normOpt.includes(normalizedQuery);
    });
  }, [options, normalizedQuery, selected]);

  const exactMatchExists = useMemo(() => {
    if (!normalizedQuery) return true;
    return options.some((opt) => normalizeAr(opt) === normalizedQuery);
  }, [options, normalizedQuery]);

  const canAddCustom = allowCustom && query.trim().length > 1 && !exactMatchExists && !selected.includes(query.trim());

  const handleSelect = (item: string) => {
    const trimmed = item.trim();
    if (!trimmed) return;
    if (selected.includes(trimmed)) {
      onChange(selected.filter((x) => x !== trimmed));
    } else {
      if (selected.length >= maxItems) return;
      onChange([...selected, trimmed]);
    }
    setQuery("");
    inputRef.current?.focus();
  };

  const handleRemove = (item: string) => {
    onChange(selected.filter((x) => x !== item));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        handleSelect(filteredOptions[0]);
      } else if (canAddCustom) {
        handleSelect(query.trim());
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Backspace" && !query && selected.length > 0) {
      handleRemove(selected[selected.length - 1]);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full space-y-2">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-bold text-[var(--muted)]">
          {label}
        </label>
      )}

      {/* Selected Items Badges (Chips) */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pb-1">
          {selected.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line-soft)] px-3 py-1.5 text-xs font-bold transition"
              style={{ background: "var(--surface-2)", color: "var(--text)" }}
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={() => handleRemove(item)}
                className="grid h-4 w-4 place-items-center rounded-full text-[var(--muted-2)] transition hover:bg-white/10 hover:text-white"
                title={`حذف ${item}`}
                aria-label={`حذف ${item}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search Input Box */}
      <div
        className="flex min-h-12 w-full items-center gap-2 rounded-2xl border px-3.5 transition-all focus-within:border-[var(--cobalt)]"
        style={{ borderColor: open ? "var(--cobalt)" : "var(--line)", background: "var(--surface-2)" }}
      >
        <Search size={15} className="shrink-0 text-[var(--muted-2)]" />
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={query}
          disabled={selected.length >= maxItems}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selected.length >= maxItems ? `تم الوصول للحد الأقصى (${maxItems})` : placeholder}
          className="min-h-10 w-full bg-transparent text-xs text-[var(--text)] outline-none placeholder:text-[var(--muted-2)]"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="text-[var(--muted-2)] hover:text-white"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown Suggestions Menu */}
      {open && (
        <div
          className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-2xl border border-[var(--line)] shadow-2xl backdrop-blur-2xl"
          style={{ background: "rgba(21, 24, 28, 0.98)" }}
        >
          {canAddCustom && (
            <button
              type="button"
              onClick={() => handleSelect(query.trim())}
              className="flex w-full items-center justify-between border-b border-[var(--line-soft)] px-4 py-2.5 text-right text-xs font-bold transition hover:bg-[var(--cobalt)]/15 text-[var(--cobalt)]"
            >
              <span className="flex items-center gap-2">
                <Plus size={14} />
                <span>إضافة جديدة: <b>«{query.trim()}»</b></span>
              </span>
              <span className="text-[10px] opacity-75">اضغط Enter للإضافة</span>
            </button>
          )}

          {filteredOptions.length > 0 ? (
            <div className="p-1.5">
              {filteredOptions.map((opt) => {
                const isSelected = selected.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-right text-xs transition hover:bg-white/5"
                    style={{
                      color: isSelected ? "var(--cobalt)" : "var(--text)",
                      background: isSelected ? "rgba(62,111,242,0.08)" : "transparent",
                      fontWeight: isSelected ? 700 : 500,
                    }}
                  >
                    <span>{opt}</span>
                    {isSelected && <Check size={14} className="text-[var(--cobalt)]" />}
                  </button>
                );
              })}
            </div>
          ) : !canAddCustom ? (
            <div className="p-4 text-center text-xs text-[var(--muted-2)]">
              {query ? "لا توجد نتائج مطابقة، يمكنك كتابة الاسم ثم الضغط على Enter." : "لا توجد خيارات متاحة"}
            </div>
          ) : null}
        </div>
      )}

      <div className="flex items-center justify-between text-[11px] text-[var(--muted-2)]">
        <span>المختار: {selected.length} من {maxItems}</span>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[var(--cobalt)] hover:underline"
          >
            مسح الكل
          </button>
        )}
      </div>
    </div>
  );
}
