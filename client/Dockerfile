# syntax=docker/dockerfile:1

# AUST Central web client, served by Caddy — which also terminates TLS and
# reverse-proxies /api to the API container, so the browser sees one origin.
# That is what lets the refresh cookie stay `sameSite=strict` (see Caddyfile).
#
#   docker build -t aust-central-web client/

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Relative on purpose: the API is served from the same origin under /api/v1,
# so no hostname is baked into the bundle and one image fits every domain.
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
