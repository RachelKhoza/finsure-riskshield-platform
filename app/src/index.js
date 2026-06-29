"use strict";

const { readConfig } = require("./config");
const { createLogger } = require("./logger");
const { createService } = require("./server");

const config = readConfig();
const logger = createLogger({
  service: config.serviceName,
  environment: config.environment
});
const server = createService({ config, logger });

server.listen(config.port, () => {
  logger.info("service_started", { port: config.port });
});

function shutdown(signal) {
  logger.info("service_stopping", { signal });
  server.close((error) => {
    if (error) {
      logger.error("service_stop_failed", { error });
      process.exit(1);
      return;
    }

    logger.info("service_stopped");
    process.exit(0);
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
