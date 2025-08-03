import { useState, useCallback, useMemo } from 'react';

export interface TableSelectionState {
  selectedIds: Set<string>;
  isAllSelected: boolean;
  isPartialSelection: boolean;
}

export const useTableSelection = <T extends { id: string }>(items: T[]) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const itemIds = useMemo(() => items.map(item => item.id), [items]);

  const isAllSelected = useMemo(() => {
    return itemIds.length > 0 && itemIds.every(id => selectedIds.has(id));
  }, [itemIds, selectedIds]);

  const isPartialSelection = useMemo(() => {
    return selectedIds.size > 0 && !isAllSelected;
  }, [selectedIds.size, isAllSelected]);

  const toggleItem = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(itemIds));
    }
  }, [isAllSelected, itemIds]);

  const selectRange = useCallback((startId: string, endId: string) => {
    const startIndex = itemIds.indexOf(startId);
    const endIndex = itemIds.indexOf(endId);
    
    if (startIndex === -1 || endIndex === -1) return;

    const start = Math.min(startIndex, endIndex);
    const end = Math.max(startIndex, endIndex);
    
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      for (let i = start; i <= end; i++) {
        newSet.add(itemIds[i]);
      }
      return newSet;
    });
  }, [itemIds]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback((id: string) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  const getSelectedItems = useCallback((): T[] => {
    return items.filter(item => selectedIds.has(item.id));
  }, [items, selectedIds]);

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    isAllSelected,
    isPartialSelection,
    toggleItem,
    toggleAll,
    selectRange,
    clearSelection,
    isSelected,
    getSelectedItems
  };
};