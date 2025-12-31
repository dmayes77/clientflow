import { useState, useCallback } from "react";
import { arrayMove } from "@dnd-kit/sortable";

/**
 * useIncludesList - Hook for managing a list of includes with add/remove/reorder
 *
 * @param {object} options
 * @param {string[]} options.initialItems - Initial list of items
 * @param {number} options.maxItems - Maximum number of items (default: 20)
 * @param {boolean} options.allowDuplicates - Allow duplicate items (default: false)
 * @param {function} options.onChange - Callback when items change
 * @returns {object} List management functions and state
 */
export function useIncludesList({
  initialItems = [],
  maxItems = 20,
  allowDuplicates = false,
  onChange,
} = {}) {
  const [items, setItems] = useState(initialItems);
  const [inputValue, setInputValue] = useState("");

  const updateItems = useCallback(
    (newItems) => {
      setItems(newItems);
      onChange?.(newItems);
    },
    [onChange]
  );

  const addItem = useCallback(
    (item) => {
      const trimmed = typeof item === "string" ? item.trim() : item;
      if (!trimmed) return false;

      if (items.length >= maxItems) {
        return false;
      }

      if (!allowDuplicates && items.includes(trimmed)) {
        return false;
      }

      updateItems([...items, trimmed]);
      setInputValue("");
      return true;
    },
    [items, maxItems, allowDuplicates, updateItems]
  );

  const removeItem = useCallback(
    (itemOrIndex) => {
      const newItems =
        typeof itemOrIndex === "number"
          ? items.filter((_, i) => i !== itemOrIndex)
          : items.filter((i) => i !== itemOrIndex);
      updateItems(newItems);
    },
    [items, updateItems]
  );

  const reorderItems = useCallback(
    (activeId, overId) => {
      if (!overId || activeId === overId) return;

      const oldIndex = items.findIndex(
        (item, i) => item === activeId || `include-${i}` === activeId
      );
      const newIndex = items.findIndex(
        (item, i) => item === overId || `include-${i}` === overId
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        updateItems(arrayMove(items, oldIndex, newIndex));
      }
    },
    [items, updateItems]
  );

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        reorderItems(active.id, over.id);
      }
    },
    [reorderItems]
  );

  const handlePaste = useCallback(
    (pastedText) => {
      if (!pastedText.includes(",")) return false;

      const pastedItems = pastedText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      if (pastedItems.length === 0) return false;

      const itemsToAdd = allowDuplicates
        ? pastedItems
        : pastedItems.filter((item) => !items.includes(item));

      const slotsAvailable = maxItems - items.length;
      const finalItems = itemsToAdd.slice(0, slotsAvailable);

      if (finalItems.length > 0) {
        updateItems([...items, ...finalItems]);
        setInputValue("");
        return true;
      }
      return false;
    },
    [items, maxItems, allowDuplicates, updateItems]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addItem(inputValue);
      }
    },
    [addItem, inputValue]
  );

  const handleInputChange = useCallback(
    (e) => {
      const value = e.target.value;
      // Check for paste of comma-separated values
      if (value.includes(",") && handlePaste(value)) {
        return;
      }
      setInputValue(value);
    },
    [handlePaste]
  );

  const clearAll = useCallback(() => {
    updateItems([]);
  }, [updateItems]);

  const setItemsDirectly = useCallback(
    (newItems) => {
      updateItems(newItems);
    },
    [updateItems]
  );

  return {
    // State
    items,
    inputValue,
    count: items.length,
    maxItems,
    isFull: items.length >= maxItems,
    isEmpty: items.length === 0,

    // Setters
    setInputValue,
    setItems: setItemsDirectly,

    // Actions
    addItem,
    removeItem,
    reorderItems,
    clearAll,

    // Event handlers (ready to attach to elements)
    handleDragEnd,
    handlePaste,
    handleKeyDown,
    handleInputChange,

    // Helpers for DnD
    dndIds: items.map((_, i) => `include-${i}`),
  };
}
