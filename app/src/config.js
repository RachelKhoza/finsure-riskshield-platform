"use strict";

const fs = require("node:fs");

function numberFromEnv(value, fallback, { min, max }) {
  if (value === undefined || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`Invalid numeric configuration value: ${value}`);
  }

  return parsed;
}

function readSecretValue(env) {
  if (env.RISKSHIELD_API_KEY_FILE) {
    return fs.readFileSync(env.RISKSHIELD_API_KEY_FILE, "utf8").trim();
  }

  return env.RISKSHIELD_API_KEY || "";
}

function readConfig(env = process.env) {
  const baseUrl = env.RISKSHIELD_BASE_URL || "https://api.riskshield.com";

  return {
    serviceName: env.SERVICE_NAME || "finsure-riskshield-service",
    environment: env.ENVIRONMENT || "local",
    port: numberFromEnv(env.PORT, 8080, { min: 1, max: 65535 }),
    riskShieldBaseUrl: baseUrl.replace(/\/+$/, ""),
    riskShieldScorePath: env.RISKSHIELD_SCORE_PATH || "/v1/score",
    riskShieldApiKey: readSecretValue(env),
    vendorTimeoutMs: numberFromEnv(env.RISKSHIELD_TIMEOUT_MS, 2500, {
      min: 250,
      max: 30000
    }),
    vendorRetries: numberFromEnv(env.RISKSHIELD_RETRIES, 2, {
      min: 0,
      max: 5
    }),
    maxBodyBytes: numberFromEnv(env.MAX_BODY_BYTES, 16384, {
      min: 1024,
      max: 1048576
    })
  };
}

module.exports = {
  readConfig
};
