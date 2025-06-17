FROM node:lts-alpine AS builder
WORKDIR /app

RUN corepack enable \
  && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

FROM nginx:stable-alpine
COPY --from=builder /app/build/client /usr/share/nginx/html

RUN rm /etc/nginx/conf.d/default.conf
