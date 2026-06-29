"use strict";

const http = require("node:http");

const port = Number(process.env.MOCK_RISKSHIELD_PORT || 9090);
const expectedApiKey = process.env.RISKSHIELD_API_KEY || "local-dev-key";

function riskLevel(score) {
  if (score >= 75) {
    return "HIGH";
  }
  if (score >= 40) {
    return "MEDIUM";
  }
  return "LOW";
}

function send(response, statusCode, body) {
  response.writeHead(statusCode, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

const server = http.createServer((request, response) => {
  if (request.method !== "POST" || request.url !== "/v1/score") {
    send(response, 404, { message: "not found" });
    return;
  }

  if (request.headers["x-api-key"] !== expectedApiKey) {
    send(response, 401, { message: "invalid api key" });
    return;
  }

  let raw = "";
  request.setEncoding("utf8");
  request.on("data", (chunk) => {
    raw += chunk;
  });
  request.on("end", () => {
    const applicant = JSON.parse(raw);
    const lastTwoDigits = Number(applicant.idNumber.slice(-2));
    const score = Number.isFinite(lastTwoDigits) ? lastTwoDigits : 50;
    send(response, 200, {
      riskScore: score,
      riskLevel: riskLevel(score)
    });
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Mock RiskShield listening on http://127.0.0.1:${port}`);
});
