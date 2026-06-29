"use strict";

function serializeError(error) {
  if (!error) {
    return undefined;
  }

  return {
    name: error.name,
    message: error.message,
    statusCode: error.statusCode
  };
}

function createLogger(baseFields = {}) {
  function write(level, message, fields = {}) {
    const record = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...baseFields,
      ...fields
    };

    if (record.error instanceof Error) {
      record.error = serializeError(record.error);
    }

    const output = JSON.stringify(record);
    if (level === "error") {
      console.error(output);
      return;
    }

    console.log(output);
  }

  return {
    child(fields = {}) {
      return createLogger({ ...baseFields, ...fields });
    },
    info(message, fields) {
      write("info", message, fields);
    },
    warn(message, fields) {
      write("warn", message, fields);
    },
    error(message, fields) {
      write("error", message, fields);
    }
  };
}

module.exports = {
  createLogger
};
