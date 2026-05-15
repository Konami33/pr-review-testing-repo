import * as itemService from "../services/item-service.js";
import { sendJson, sendNoContent } from "../lib/http-response.js";

export async function listItems(_req, res) {
  const items = itemService.listItems();
  sendJson(res, 200, { data: items });
}

export async function getItem(req, res, next) {
  try {
    const item = itemService.getItem(req.params.id);
    sendJson(res, 200, { data: item });
  } catch (err) {
    next(err);
  }
}

export async function createItem(req, res, next) {
  try {
    const item = itemService.createItem(req.body ?? {});
    sendJson(res, 201, { data: item });
  } catch (err) {
    next(err);
  }
}

export async function updateItem(req, res, next) {
  try {
    const item = itemService.updateItem(req.params.id, req.body ?? {});
    sendJson(res, 200, { data: item });
  } catch (err) {
    next(err);
  }
}

export async function deleteItem(req, res, next) {
  try {
    itemService.deleteItem(req.params.id);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}
