"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * useDebounce - Hook to debounce a value
 *
 * @param {any} value - Value to debounce
 * @param {number} delay - Delay in milliseconds (default: 300)
 * @returns {any} Debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * SearchInput - Search input with icon, clear button, and optional debounce
 *
 * @param {object} props
 * @param {string} props.value - Current search value
 * @param {function} props.onChange - Called with new value on each keystroke
 * @param {function} props.onSearch - Called with debounced value (if debounce > 0)
 * @param {string} props.placeholder - Placeholder text (default: "Search...")
 * @param {number} props.debounce - Debounce delay in ms (0 to disable)
 * @param {boolean} props.loading - Show loading spinner
 * @param {boolean} props.showClear - Show clear button when has value (default: true)
 * @param {string} props.className - Additional classes for wrapper
 * @param {string} props.inputClassName - Additional classes for input
 */
export function SearchInput({
  value,
  onChange,
  onSearch,
  placeholder = "Search...",
  debounce = 300,
  loading = false,
  showClear = true,
  className,
  inputClassName,
  ...props
}) {
  const [localValue, setLocalValue] = useState(value ?? "");
  const debouncedValue = useDebounce(localValue, debounce);

  // Sync with external value
  useEffect(() => {
    if (value !== undefined && value !== localValue) {
      setLocalValue(value);
    }
  }, [value]);

  // Call onSearch with debounced value
  useEffect(() => {
    if (onSearch && debounce > 0) {
      onSearch(debouncedValue);
    }
  }, [debouncedValue, onSearch, debounce]);

  const handleChange = useCallback(
    (e) => {
      const newValue = e.target.value;
      setLocalValue(newValue);
      onChange?.(newValue);
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    setLocalValue("");
    onChange?.("");
    onSearch?.("");
  }, [onChange, onSearch]);

  const hasValue = localValue.length > 0;

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        type="search"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn("pl-9 pr-9", inputClassName)}
        {...props}
      />
      {loading ? (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
      ) : hasValue && showClear ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Clear search</span>
        </Button>
      ) : null}
    </div>
  );
}

/**
 * SearchForm - Search input with form submission
 *
 * @param {object} props
 * @param {function} props.onSubmit - Called with search value on form submit
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.loading - Show loading state
 * @param {string} props.className - Additional classes
 */
export function SearchForm({
  onSubmit,
  placeholder = "Search...",
  loading = false,
  className,
  ...props
}) {
  const [value, setValue] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(value);
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <SearchInput
        value={value}
        onChange={setValue}
        placeholder={placeholder}
        loading={loading}
        debounce={0}
        {...props}
      />
    </form>
  );
}
