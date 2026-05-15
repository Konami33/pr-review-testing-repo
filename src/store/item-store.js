/** In-memory item store for the sample CRUD API. */

const items = new Map();
let nextId = 1;

export function listItems() {
  return Array.from(items.values());
}

export function getItemById(id) {
  return items.get(id) ?? null;
}

export function createItem({ name, description = "" }) {
  const id = String(nextId++);
  const item = {
    id,
    name,
    description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  items.set(id, item);
  return item;
}

export function updateItem(id, patch) {
  const existing = items.get(id);
  if (!existing) return null;

  const updated = {
    ...existing,
    ...patch,
    id: existing.id,
    updatedAt: new Date().toISOString(),
  };
  items.set(id, updated);
  return updated;
}

export function deleteItem(id) {
  return items.delete(id);
}

export function resetStore() {
  items.clear();
  nextId = 1;
}
