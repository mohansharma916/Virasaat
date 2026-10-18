# syntax=docker/dockerfile:1
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

# The npm cache lives in a BuildKit cache mount, not in an image layer.
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

COPY . .

RUN npm run build


FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

# One layer, so deleted files never reach the image. TypeScript and ts-node
# are only TypeORM's optional CLI peers; source maps, type definitions and
# docs are never read at runtime.
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev --no-audit --no-fund \
  && rm -rf node_modules/typescript node_modules/ts-node \
  && find node_modules -type f \( -name '*.map' -o -name '*.d.ts' -o -name '*.d.mts' -o -name '*.d.cts' -o -iname '*.md' -o -iname 'CHANGELOG*' \) -delete

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/migrations ./migrations

EXPOSE 3000

# Run without root privileges inside the container.
USER node

CMD ["node", "dist/main.js"]
