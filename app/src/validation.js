"use strict";

class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = "ValidationError";
    this.details = details;
  }
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateApplicantPayload(payload) {
  const errors = [];

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new ValidationError("Request body must be a JSON object.", [
      "body must be an object"
    ]);
  }

  if (!hasText(payload.firstName)) {
    errors.push("firstName is required");
  }

  if (!hasText(payload.lastName)) {
    errors.push("lastName is required");
  }

  if (!hasText(payload.idNumber)) {
    errors.push("idNumber is required");
  } else if (!/^\d{13}$/.test(payload.idNumber.trim())) {
    errors.push("idNumber must be 13 digits");
  }

  if (errors.length > 0) {
    throw new ValidationError("Invalid applicant details.", errors);
  }

  return {
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim(),
    idNumber: payload.idNumber.trim()
  };
}

function maskIdNumber(idNumber) {
  if (!idNumber || idNumber.length < 4) {
    return "****";
  }

  return `${"*".repeat(Math.max(idNumber.length - 4, 0))}${idNumber.slice(-4)}`;
}

module.exports = {
  ValidationError,
  maskIdNumber,
  validateApplicantPayload
};
