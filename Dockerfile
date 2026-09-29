# ─────────────────────────────────────────────
# Stage 1 — Build React app
# ─────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Variables publiques (safe à exposer au navigateur) injectées au build — CRA les intègre
# dans le bundle statique, elles doivent donc être connues à ce stade, pas au runtime.
ARG REACT_APP_SUPABASE_URL
ARG REACT_APP_SUPABASE_ANON_KEY
ENV REACT_APP_SUPABASE_URL=$REACT_APP_SUPABASE_URL
ENV REACT_APP_SUPABASE_ANON_KEY=$REACT_APP_SUPABASE_ANON_KEY

# Pas de script inline dans index.html : permet une CSP stricte (script-src 'self').
ENV INLINE_RUNTIME_CHUNK=false
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2 — Runtime : Express sert l'API + le build statique
# ─────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

RUN apk add --no-cache curl

COPY package*.json ./
# Seules les dépendances serveur (express, dotenv, supabase-js) sont en `dependencies` : tout le
# tooling front (react-scripts, tailwind, tests) est en devDependencies et reste dans le builder.
RUN npm ci --omit=dev

COPY --from=builder /app/build ./build
COPY api ./api
COPY server.js ./

ENV NODE_ENV=production
ENV PORT=3000
# Ne tourne plus en root.
USER node
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "server.js"]
