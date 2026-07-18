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
# Envoi direct des formulaires Contact/Réclamations via Brevo (fallback sans backend).
ARG VITE_BREVO_API_KEY
ARG VITE_BREVO_SENDER_EMAIL
ARG VITE_BREVO_SENDER_NAME
ENV VITE_BREVO_API_KEY=$VITE_BREVO_API_KEY
ENV VITE_BREVO_SENDER_EMAIL=$VITE_BREVO_SENDER_EMAIL
ENV VITE_BREVO_SENDER_NAME=$VITE_BREVO_SENDER_NAME
RUN npm run build

# --- Étape 2 : Caddy sert la SPA + reverse-proxy vers l'API ---
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
