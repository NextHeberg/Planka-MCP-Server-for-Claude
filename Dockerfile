# NOTE: Due to Docker DNS issues with VPN nameservers, this Dockerfile uses
# pre-built artifacts from the host. Run before building:
#   npm ci && npm run build
#
# For a permanent fix, add DNS to /etc/docker/daemon.json:
#   "dns": ["8.8.8.8", "8.8.4.4"]
# then restart Docker.

# --- Stage 1 : Prune dev dependencies ---
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
COPY node_modules ./node_modules
# Remove dev dependencies without network access
RUN npm prune --omit=dev

# --- Stage 2 : Production ---
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY dist ./dist

# Security: don't run as root
USER node

EXPOSE 3001

# Environment variables (documented, no default for secrets)
ENV PLANKA_BASE_URL=""
ENV PLANKA_API_KEY=""
ENV PLANKA_EMAIL=""
ENV PLANKA_PASSWORD=""
ENV PORT=3001
ENV NODE_TLS_REJECT_UNAUTHORIZED="true"
ENV PLANKA_REQUEST_TIMEOUT=30000
ENV LOG_LEVEL=info

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "dist/index.js"]
