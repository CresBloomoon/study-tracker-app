const { ApiError } = require("../domain/errors");
const { isYyyyMmDd } = require("../domain/time");

function requireUuid(value, fieldName) {
  if (typeof value !== "string" || value.length < 10) {
    throw new ApiError(400, "VALIDATION_ERROR", `${fieldName} is required`);
  }
  return value;
}

function optionalUuid(value, fieldName) {
  if (value == null || value === "") return null;
  if (typeof value !== "string" || value.length < 10) {
    throw new ApiError(400, "VALIDATION_ERROR", `${fieldName} must be uuid string`);
  }
  return value;
}

function requirePositiveInt(value, fieldName) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new ApiError(400, "VALIDATION_ERROR", `${fieldName} must be a positive integer`);
  }
  return value;
}

function optionalDate(value, fieldName) {
  if (value == null) return null;
  if (!isYyyyMmDd(value)) {
    throw new ApiError(400, "VALIDATION_ERROR", `${fieldName} must be YYYY-MM-DD`);
  }
  return value;
}

function requireDate(value, fieldName) {
  if (!isYyyyMmDd(value)) {
    throw new ApiError(400, "VALIDATION_ERROR", `${fieldName} must be YYYY-MM-DD`);
  }
  return value;
}

function requireNonEmptyString(value, fieldName, { maxLength } = {}) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiError(400, "VALIDATION_ERROR", `${fieldName} is required`);
  }
  const trimmed = value.trim();
  if (maxLength && trimmed.length > maxLength) {
    throw new ApiError(400, "VALIDATION_ERROR", `${fieldName} is too long (max ${maxLength})`);
  }
  return trimmed;
}

function optionalString(value, fieldName, { maxLength } = {}) {
  if (value == null || value === "") return null;
  if (typeof value !== "string") {
    throw new ApiError(400, "VALIDATION_ERROR", `${fieldName} must be a string`);
  }
  if (maxLength && value.length > maxLength) {
    throw new ApiError(400, "VALIDATION_ERROR", `${fieldName} is too long (max ${maxLength})`);
  }
  return value;
}

module.exports = {
  requireUuid,
  optionalUuid,
  requirePositiveInt,
  optionalDate,
  requireDate,
  requireNonEmptyString,
  optionalString,
};
