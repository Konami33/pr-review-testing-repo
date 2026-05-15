export function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

export function sendNoContent(res) {
  res.writeHead(204);
  res.end();
}
