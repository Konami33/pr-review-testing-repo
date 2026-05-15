import { sendJson } from "../lib/http-response.js";

const ERROR_STATUS = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
};

export function errorHandler(err, _req, res, _next) {
  const status = ERROR_STATUS[err.code] ?? 500;
  sendJson(res, status, {
    error: {
      code: err.code ?? "INTERNAL_ERROR",
      message: status === 500 ? "Internal server error" : err.message,
    },
  });
}
