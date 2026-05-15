import * as itemStore from "../store/item-store.js";

export function listItems() {
  return itemStore.listItems();
}

// get the item by id
export function getItem(id) {
  const item = itemStore.getItemById(id);
  if (!item) {
    const err = new Error(`Item not found: ${id}`);
    err.code = "NOT_FOUND";
    throw err;
  }
  return item;
}

// create the item
export function createItem(payload) {
  validateItemPayload(payload, { requireName: true });
  return itemStore.createItem({
    name: payload.name.trim(),
    description: (payload.description ?? "").trim(),
  });
}

// update the item
export function updateItem(id, payload) {
  validateItemPayload(payload, { requireName: false });
  const patch = {};
  if (payload.name !== undefined) patch.name = payload.name.trim();
  if (payload.description !== undefined) {
    patch.description = payload.description.trim();
  }

  const updated = itemStore.updateItem(id, patch);
  if (!updated) {
    const err = new Error(`Item not found: ${id}`);
    err.code = "NOT_FOUND";
    throw err;
  }
  return updated;
}

// delete the item
export function deleteItem(id) {
  const removed = itemStore.deleteItem(id);
  if (!removed) {
    const err = new Error(`Item not found: ${id}`);
    err.code = "NOT_FOUND";
    throw err;
  }
}

// validate the item payload
function validateItemPayload(payload, { requireName }) {
  if (requireName && (!payload.name || typeof payload.name !== "string")) {
    const err = new Error("name is required and must be a non-empty string");
    err.code = "VALIDATION_ERROR";
    throw err;
  }
  if (payload.name !== undefined && typeof payload.name !== "string") {
    const err = new Error("name must be a string");
    err.code = "VALIDATION_ERROR";
    throw err;
  }
  if (payload.description !== undefined && typeof payload.description !== "string") {
    const err = new Error("description must be a string");
    err.code = "VALIDATION_ERROR";
    throw err;
  }
}
