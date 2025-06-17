FROM node:lts-slim as base
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && apt-get clean \
  && corepack enable \
  && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

RUN pnpm install --frozen-lockfile

# API
FROM base AS api

RUN pnpm prisma generate

EXPOSE 8000
CMD ["pnpm", "exec", "tsx", "src/index.ts"]

# Worker
FROM base AS worker

RUN pnpm exec playwright install --with-deps chromium 

CMD ["pnpm", "exec", "tsx", "src/workers/index.ts"]
