"use strict";

const assert = require("node:assert/strict");
const http = require("node:http");
const { test } = require("node:test");
const { createService } = require("../src/server");

const noopLogger = {
  child() {
    return this;
  },
  info() {},
  warn() {},
  error() {}
};

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve(`http://127.0.0.1:${address.port}`);
    });
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

function requestJson(url, { method = "GET", body, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const request = http.request(
      url,
      {
        method,
        headers: {
          ...(body ? { "content-type": "application/json" } : {}),
          ...headers
        }
      },
      (response) => {
        let raw = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          raw += chunk;
        });
        response.on("end", () => {
          resolve({
            statusCode: response.statusCode,
            headers: response.headers,
            body: raw ? JSON.parse(raw) : undefined
          });
        });
      }
    );

    request.on("error", reject);
    if (body) {
      request.write(JSON.stringify(body));
    }
    request.end();
  });
}

function createVendorServer(handler) {
  return http.createServer((request, response) => {
    let raw = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      raw += chunk;
    });
    request.on("end", () => {
      handler(request, response, raw ? JSON.parse(raw) : undefined);
    });
  });
}

function createConfig(overrides = {}) {
  return {
    serviceName: "test-service",
    environment: "test",
    port: 0,
    riskShieldBaseUrl: "http://127.0.0.1",
    riskShieldScorePath: "/v1/score",
    riskShieldApiKey: "test-key",
    vendorTimeoutMs: 500,
    vendorRetries: 0,
    maxBodyBytes: 16384,
    ...overrides
  };
}

test("POST /validate returns the vendor risk score and propagates correlation ID", async () => {
  let vendorRequest;
  const vendor = createVendorServer((request, response, body) => {
    vendorRequest = { request, body };
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ riskScore: 72, riskLevel: "MEDIUM" }));
  });

  const vendorUrl = await listen(vendor);
  const service = createService({
    config: createConfig({ riskShieldBaseUrl: vendorUrl }),
    logger: noopLogger
  });
  const serviceUrl = await listen(service);

  try {
    const response = await requestJson(`${serviceUrl}/validate`, {
      method: "POST",
      headers: { "x-correlation-id": "loan-application-123" },
      body: {
        firstName: "Jane",
        lastName: "Doe",
        idNumber: "9001011234088"
      }
    });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, { riskScore: 72, riskLevel: "MEDIUM" });
    assert.equal(response.headers["x-correlation-id"], "loan-application-123");
    assert.equal(vendorRequest.request.headers["x-api-key"], "test-key");
    assert.equal(vendorRequest.request.headers["x-correlation-id"], "loan-application-123");
    assert.deepEqual(vendorRequest.body, {
      firstName: "Jane",
      lastName: "Doe",
      idNumber: "9001011234088"
    });
  } finally {
    await close(service);
    await close(vendor);
  }
});

test("POST /validate rejects malformed applicant details before calling vendor", async () => {
  let vendorCalls = 0;
  const vendor = createVendorServer((_request, response) => {
    vendorCalls += 1;
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ riskScore: 1, riskLevel: "LOW" }));
  });

  const vendorUrl = await listen(vendor);
  const service = createService({
    config: createConfig({ riskShieldBaseUrl: vendorUrl }),
    logger: noopLogger
  });
  const serviceUrl = await listen(service);

  try {
    const response = await requestJson(`${serviceUrl}/validate`, {
      method: "POST",
      body: {
        firstName: "Jane",
        lastName: "Doe",
        idNumber: "ABC"
      }
    });

    assert.equal(response.statusCode, 400);
    assert.equal(response.body.code, "INVALID_REQUEST");
    assert.equal(vendorCalls, 0);
  } finally {
    await close(service);
    await close(vendor);
  }
});

test("POST /validate retries transient vendor failures", async () => {
  let vendorCalls = 0;
  const vendor = createVendorServer((_request, response) => {
    vendorCalls += 1;
    if (vendorCalls === 1) {
      response.writeHead(503, { "content-type": "application/json" });
      response.end(JSON.stringify({ message: "try again" }));
      return;
    }

    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ riskScore: 18, riskLevel: "LOW" }));
  });

  const vendorUrl = await listen(vendor);
  const service = createService({
    config: createConfig({ riskShieldBaseUrl: vendorUrl, vendorRetries: 1 }),
    logger: noopLogger
  });
  const serviceUrl = await listen(service);

  try {
    const response = await requestJson(`${serviceUrl}/validate`, {
      method: "POST",
      body: {
        firstName: "Jane",
        lastName: "Doe",
        idNumber: "9001011234088"
      }
    });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, { riskScore: 18, riskLevel: "LOW" });
    assert.equal(vendorCalls, 2);
  } finally {
    await close(service);
    await close(vendor);
  }
});
