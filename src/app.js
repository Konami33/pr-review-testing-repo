import { createServer } from "node:http";
import { json } from "node:stream/consumers";
import * as itemController from "./controllers/item-controller.js";
import { errorHandler } from "./middleware/error-handler.js";
import { sendJson } from "./lib/http-response.js";
import { getItemById, listItems } from "./store/item-store.js";

// parse the json body of the request
async function parseJsonBody(req) {
  if (req.method === "GET" || req.method === "DELETE") return {};
  const contentType = req.headers["content-type"] ?? "";
  if (!contentType.includes("application/json")) return {};
  try {
    const raw = await json(req);
    return typeof raw === "object" && raw !== null ? raw : {};
  } catch {
    const err = new Error("Invalid JSON body");
    err.code = "VALIDATION_ERROR";
    throw err;
  }
}

// match the route of the request
function matchRoute(url) {
  const pathname = new URL(url, "http://localhost").pathname;
  if (pathname === "/health") return { type: "health" };
  if (pathname === "/api/items") return { type: "items", id: undefined };
  const idMatch = pathname.match(/^\/api\/items\/([^/]+)$/);
  if (idMatch) return { type: "items", id: idMatch[1] };
  return { type: "not_found" };
}

function runHandler(handler, req, res) {
  Promise.resolve(handler(req, res, (err) => errorHandler(err, req, res, () => {}))).catch(
    (err) => errorHandler(err, req, res, () => {})
  );
}

// create the app
export function createApp() {
  return createServer(async (req, res) => {
    const route = matchRoute(req.url ?? "/");

    if (route.type === "health") {
      sendJson(res, 200, { status: "ok" });
      return;
    }

    if (route.type !== "items") {
      sendJson(res, 404, { error: { code: "NOT_FOUND", message: "Route not found" } });
      return;
    }

    try {
      req.body = await parseJsonBody(req);
    } catch (err) {
      errorHandler(err, req, res, () => {});
      return;
    }

    req.params = route.id ? { id: route.id } : {};
    const method = req.method ?? "GET";

    if (method === "GET" && !route.id) return sendJson(res, 200, { data: listItems() });
    if (method === "GET" && route.id) {
      const item = getItemById(route.id);
      if (!item) {
        sendJson(res, 404, {
          error: { code: "NOT_FOUND", message: `Item not found: ${route.id}` },
        });
        return;
      }
      return sendJson(res, 200, { data: item });
    }
    if (method === "POST" && !route.id) return runHandler(itemController.createItem, req, res);
    if (method === "PUT" && route.id) return runHandler(itemController.updateItem, req, res);
    if (method === "DELETE" && route.id) return runHandler(itemController.deleteItem, req, res);

    sendJson(res, 405, { error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" } });
  });
}
