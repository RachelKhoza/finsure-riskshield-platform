"use strict";

const http = require("node:http");
const { randomUUID } = require("node:crypto");
const { readConfig } = require("./config");
const { createLogger } = require("./logger");
const {
  ConfigError,
  VendorHttpError,
  VendorInvalidResponseError,
  VendorNetworkError,
  VendorTimeoutError,
  scoreApplicant
} = require("./riskShieldClient");
const {
  ValidationError,
  maskIdNumber,
  validateApplicantPayload
} = require("./validation");

function sendJson(response, statusCode, payload, correlationId) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-correlation-id": correlationId
  });
  response.end(JSON.stringify(payload));
}

function getCorrelationId(request) {
  const incoming = request.headers["x-correlation-id"];
  if (typeof incoming === "string" && incoming.trim().length > 0 && incoming.length <= 128) {
    return incoming.trim();
  }

  return randomUUID();
}

function readRequestBody(request, maxBodyBytes) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let rejected = false;
    const chunks = [];

    request.on("data", (chunk) => {
      if (rejected) {
        return;
      }

      size += chunk.length;
      if (size > maxBodyBytes) {
        rejected = true;
        reject(new ValidationError("Request body is too large.", ["body exceeds size limit"]));
        return;
      }
      chunks.push(chunk);
    });

    request.on("end", () => {
      if (rejected) {
        return;
      }

      resolve(Buffer.concat(chunks).toString("utf8"));
    });

    request.on("error", reject);
  });
}

async function parseJsonBody(request, maxBodyBytes) {
  const contentType = request.headers["content-type"] || "";
  if (!String(contentType).toLowerCase().includes("application/json")) {
    throw new ValidationError("Content-Type must be application/json.", [
      "content-type must be application/json"
    ]);
  }

  const rawBody = await readRequestBody(request, maxBodyBytes);
  try {
    return JSON.parse(rawBody);
  } catch (error) {
    throw new ValidationError("Request body must be valid JSON.", ["body is not valid JSON"]);
  }
}

function mapError(error) {
  if (error instanceof ValidationError) {
    return {
      statusCode: 400,
      code: "INVALID_REQUEST",
      message: error.message,
      details: error.details
    };
  }

  if (error instanceof ConfigError) {
    return {
      statusCode: 500,
      code: "SERVICE_NOT_CONFIGURED",
      message: "Risk validation service is not configured."
    };
  }

  if (error instanceof VendorTimeoutError) {
    return {
      statusCode: 504,
      code: "UPSTREAM_TIMEOUT",
      message: "Risk validation provider timed out."
    };
  }

  if (error instanceof VendorHttpError) {
    const statusCode = error.statusCode === 429 ? 503 : 502;
    return {
      statusCode,
      code: "UPSTREAM_UNAVAILABLE",
      message: "Risk validation provider returned an unsuccessful response."
    };
  }

  if (error instanceof VendorInvalidResponseError || error instanceof VendorNetworkError) {
    return {
      statusCode: 502,
      code: "UPSTREAM_UNAVAILABLE",
      message: "Risk validation provider is unavailable."
    };
  }

  return {
    statusCode: 500,
    code: "INTERNAL_ERROR",
    message: "Unexpected service error."
  };
}

function createService(options = {}) {
  const config = options.config || readConfig();
  const baseLogger =
    options.logger ||
    createLogger({
      service: config.serviceName,
      environment: config.environment
    });

  return http.createServer(async (request, response) => {
    const correlationId = getCorrelationId(request);
    const logger = baseLogger.child({ correlationId });
    response.setHeader("x-correlation-id", correlationId);

    try {
      if (request.method === "GET" && request.url === "/healthz") {
        sendJson(response, 200, { status: "ok" }, correlationId);
        return;
      }

      if (request.method === "GET" && request.url === "/readyz") {
        const ready = Boolean(config.riskShieldApiKey);
        sendJson(
          response,
          ready ? 200 : 503,
          { status: ready ? "ready" : "missing_vendor_secret" },
          correlationId
        );
        return;
      }

      if (request.method !== "POST" || request.url !== "/validate") {
        sendJson(
          response,
          404,
          { code: "NOT_FOUND", message: "Route not found." },
          correlationId
        );
        return;
      }

      const body = await parseJsonBody(request, config.maxBodyBytes);
      const applicant = validateApplicantPayload(body);

      logger.info("validation_started", {
        idNumberMasked: maskIdNumber(applicant.idNumber)
      });

      const result = await scoreApplicant(applicant, {
        config,
        correlationId,
        logger
      });

      logger.info("validation_completed", {
        idNumberMasked: maskIdNumber(applicant.idNumber),
        riskLevel: result.riskLevel
      });

      sendJson(response, 200, result, correlationId);
    } catch (error) {
      const mapped = mapError(error);
      const logFields = {
        error,
        statusCode: mapped.statusCode,
        errorCode: mapped.code
      };

      if (mapped.statusCode >= 500) {
        logger.error("request_failed", logFields);
      } else {
        logger.warn("request_rejected", logFields);
      }

      sendJson(
        response,
        mapped.statusCode,
        {
          code: mapped.code,
          message: mapped.message,
          details: mapped.details
        },
        correlationId
      );
    }
  });
}

module.exports = {
  createService
};
