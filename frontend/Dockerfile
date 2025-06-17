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
COPY --from=builder /app/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/nginx/cloudflare.conf /etc/nginx/conf.d/cloudflare.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
