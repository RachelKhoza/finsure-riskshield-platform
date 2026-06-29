"use strict";

class ConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConfigError";
  }
}

class VendorHttpError extends Error {
  constructor(statusCode, message = "RiskShield returned an unsuccessful response.") {
    super(message);
    this.name = "VendorHttpError";
    this.statusCode = statusCode;
  }
}

class VendorInvalidResponseError extends Error {
  constructor(message = "RiskShield returned an invalid response.") {
    super(message);
    this.name = "VendorInvalidResponseError";
  }
}

class VendorNetworkError extends Error {
  constructor(message = "RiskShield request failed.") {
    super(message);
    this.name = "VendorNetworkError";
  }
}

class VendorTimeoutError extends Error {
  constructor(message = "RiskShield request timed out.") {
    super(message);
    this.name = "VendorTimeoutError";
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelayMs(attempt) {
  const base = 125 * 2 ** attempt;
  const jitter = Math.floor(Math.random() * 75);
  return base + jitter;
}

function isRetryableStatus(statusCode) {
  return [408, 429, 500, 502, 503, 504].includes(statusCode);
}

function isAbortError(error) {
  return error && (error.name === "AbortError" || error.code === "ABORT_ERR");
}

function validateVendorResponse(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new VendorInvalidResponseError();
  }

  if (
    typeof payload.riskScore !== "number" ||
    payload.riskScore < 0 ||
    payload.riskScore > 100
  ) {
    throw new VendorInvalidResponseError("RiskShield response did not include a valid riskScore.");
  }

  if (typeof payload.riskLevel !== "string" || payload.riskLevel.trim() === "") {
    throw new VendorInvalidResponseError("RiskShield response did not include a valid riskLevel.");
  }

  return {
    riskScore: payload.riskScore,
    riskLevel: payload.riskLevel
  };
}

async function scoreApplicant(applicant, { config, correlationId, logger }) {
  if (!config.riskShieldApiKey) {
    throw new ConfigError("RiskShield API key is not configured.");
  }

  const url = new URL(config.riskShieldScorePath, config.riskShieldBaseUrl);
  const body = JSON.stringify(applicant);
  const maxAttempts = config.vendorRetries + 1;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const startedAt = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.vendorTimeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": config.riskShieldApiKey,
          "x-correlation-id": correlationId,
          "user-agent": `${config.serviceName}/1.0`
        },
        body,
        signal: controller.signal
      });

      const durationMs = Date.now() - startedAt;
      const responseText = await response.text();

      if (!response.ok) {
        if (isRetryableStatus(response.status) && attempt < maxAttempts - 1) {
          logger.warn("riskshield_retry", {
            attempt: attempt + 1,
            maxAttempts,
            vendorStatusCode: response.status,
            durationMs
          });
          await sleep(retryDelayMs(attempt));
          continue;
        }

        throw new VendorHttpError(response.status);
      }

      let payload;
      try {
        payload = JSON.parse(responseText);
      } catch (error) {
        throw new VendorInvalidResponseError("RiskShield response was not valid JSON.");
      }

      logger.info("riskshield_success", {
        attempt: attempt + 1,
        vendorStatusCode: response.status,
        durationMs
      });

      return validateVendorResponse(payload);
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      const timedOut = isAbortError(error);
      const retryableNetworkError =
        !(error instanceof VendorHttpError) &&
        !(error instanceof VendorInvalidResponseError) &&
        !(error instanceof ConfigError);

      if ((timedOut || retryableNetworkError) && attempt < maxAttempts - 1) {
        logger.warn("riskshield_retry", {
          attempt: attempt + 1,
          maxAttempts,
          durationMs,
          error
        });
        await sleep(retryDelayMs(attempt));
        continue;
      }

      if (timedOut) {
        throw new VendorTimeoutError();
      }

      if (
        error instanceof VendorHttpError ||
        error instanceof VendorInvalidResponseError ||
        error instanceof ConfigError
      ) {
        throw error;
      }

      throw new VendorNetworkError(error.message);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new VendorNetworkError();
}

module.exports = {
  ConfigError,
  VendorHttpError,
  VendorInvalidResponseError,
  VendorNetworkError,
  VendorTimeoutError,
  scoreApplicant
};
