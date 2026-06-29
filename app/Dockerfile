# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS test
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY src ./src
COPY test ./test
RUN npm test
RUN mkdir -p node_modules && npm prune --omit=dev

FROM node:22-alpine AS runtime
ENV NODE_ENV=production \
    PORT=8080 \
    SERVICE_NAME=finsure-riskshield-service
WORKDIR /app
COPY --from=test --chown=node:node /app/package*.json ./
COPY --from=test --chown=node:node /app/src ./src
COPY --from=test --chown=node:node /app/node_modules ./node_modules
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('node:http').get('http://127.0.0.1:8080/healthz', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"
CMD ["node", "src/index.js"]
