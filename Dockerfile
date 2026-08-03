# syntax=docker/dockerfile:1

# --- Étape 1 : build de la SPA Vite/React ---
FROM node:20-alpine AS build
WORKDIR /app

# Installe les dépendances (dev incluses : tsc + vite en ont besoin)
COPY package*.json ./
RUN npm ci

# Code source
COPY . .

# L'URL de l'API est injectée AU BUILD (Vite inline les VITE_* dans le bundle).
# Fournie par docker-compose : https://${DOMAIN}/api/v1
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Observabilité : la release estampille les erreurs remontées par Faro et doit
# correspondre au dossier de source maps côté stack d'observabilité.
ARG VITE_APP_RELEASE=dev
ARG VITE_APP_ENV=production
ARG VITE_FARO_ENABLED=true
ENV VITE_APP_RELEASE=$VITE_APP_RELEASE
ENV VITE_APP_ENV=$VITE_APP_ENV
ENV VITE_FARO_ENABLED=$VITE_FARO_ENABLED

RUN npm run build

# --- Étape 2 : extraction des source maps ---
# Non publiées. À récupérer pour symboliser les stacks :
#   docker build --target sourcemaps --output type=local,dest=./sourcemaps .
# puis copier le contenu dans ProColis-Api/deploy/observability/sourcemaps/<APP_RELEASE>/
FROM scratch AS sourcemaps
COPY --from=build /app/dist/assets/*.map /assets/

# --- Étape 3 : Caddy sert la SPA + reverse-proxy vers l'API ---
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
# Ceinture et bretelles avec la règle Caddy : l'image servie ne contient même
# pas les source maps.
RUN find /srv -name '*.map' -delete
