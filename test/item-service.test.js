import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import * as itemService from "../src/services/item-service.js";
import { resetStore } from "../src/store/item-store.js";

describe("item-service", () => {
  beforeEach(() => resetStore());

  it("creates and lists items", () => {
    const created = itemService.createItem({ name: "Widget", description: "A widget" });
    const items = itemService.listItems();
    assert.equal(items.length, 1);
    assert.equal(items[0].id, created.id);
    assert.equal(items[0].name, "Widget");
  });

  it("throws NOT_FOUND for missing id", () => {
    assert.throws(
      () => itemService.getItem("999"),
      (err) => err.code === "NOT_FOUND"
    );
  });

  it("throws VALIDATION_ERROR when name missing on create", () => {
    assert.throws(
      () => itemService.createItem({}),
      (err) => err.code === "VALIDATION_ERROR"
    );
  });
});
