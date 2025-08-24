import { FilterFunction, SavedFilter } from './filter-types';

const savedFilters: Record<string, SavedFilter> = {};

export function saveFilter(id: string, name: string, filters: FilterFunction[], description?: string): void {
  const now = new Date();
  savedFilters[id] = {
    id,
    name,
    ...(description !== undefined ? { description } : {}),
    createdAt: now,
    updatedAt: now,
    filters,
  };
}

export function loadFilter(id: string): SavedFilter | undefined {
  return savedFilters[id];
}

export function deleteFilter(id: string): boolean {
  if (savedFilters[id]) {
    delete savedFilters[id];
    return true;
  }
  return false;
}

export function listSavedFilters(): SavedFilter[] {
  return Object.values(savedFilters);
}