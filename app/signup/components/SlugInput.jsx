"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, X, Loader2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateSlug } from "@/lib/signup-state";

export function SlugInput({ businessName, value, onChange, onValidChange }) {
  const [isEditing, setIsEditing] = useState(false);
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState("");

  // Auto-generate slug from business name
  useEffect(() => {
    if (!isEditing && businessName) {
      const newSlug = generateSlug(businessName);
      if (newSlug !== value) {
        onChange(newSlug);
        setAvailable(null);
      }
    }
  }, [businessName, isEditing, onChange, value]);

  // Check slug availability (debounced)
  const checkSlug = useCallback(async (slug) => {
    if (!slug || slug.length < 3) {
      setAvailable(null);
      setError(slug ? "Slug must be at least 3 characters" : "");
      setSuggestions([]);
      onValidChange?.(false);
      return;
    }

    setChecking(true);
    setError("");

    try {
      const res = await fetch("/api/signup/check-slug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to check availability");
        setAvailable(false);
        onValidChange?.(false);
        return;
      }

      setAvailable(data.available);
      setSuggestions(data.suggestions || []);
      onValidChange?.(data.available);
    } catch (err) {
      setError("Failed to check availability");
      setAvailable(false);
      onValidChange?.(false);
    } finally {
      setChecking(false);
    }
  }, [onValidChange]);

  // Debounce slug check
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (value) {
        checkSlug(value);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [value, checkSlug]);

  const handleSuggestionClick = (suggestion) => {
    onChange(suggestion);
    setIsEditing(true);
  };

  return (
    <div className="space-y-1.5">
      {/* Slug input */}
      <div className="relative">
        <div className="flex h-11 items-center border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
          <span className="px-3 bg-gray-100 text-gray-500 hig-caption1 border-r border-gray-300 h-full flex items-center">
            clientflow.app/
          </span>
          <input
            type="text"
            value={value}
            onChange={(e) => {
              const newValue = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
              onChange(newValue);
              setIsEditing(true);
            }}
            placeholder="your-business"
            className={cn(
              "flex-1 min-w-0 px-3 hig-body outline-none",
              isEditing ? "bg-white" : "bg-gray-50"
            )}
            disabled={!isEditing && !value}
          />
          <div className="px-3 flex items-center gap-2">
            {checking && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
            {!checking && available === true && (
              <Check className="w-4 h-4 text-green-500" />
            )}
            {!checking && available === false && (
              <X className="w-4 h-4 text-red-500" />
            )}
            {!isEditing && value && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status message */}
      {error && <p className="hig-caption2 text-red-500">{error}</p>}
      {!error && available === true && (
        <p className="hig-caption2 text-green-600">This URL is available!</p>
      )}
      {!error && available === false && !checking && (
        <p className="hig-caption2 text-red-500">This URL is already taken</p>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-1">
          <p className="hig-caption2 text-gray-500">Try one of these:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-2 py-1 hig-caption2 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Helper text */}
      <p className="hig-caption2 text-gray-400">
        This will be your booking page URL
      </p>
    </div>
  );
}
