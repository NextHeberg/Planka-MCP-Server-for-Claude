# --- Stage 1 : Build ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Stage 2 : Production ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy only what's needed
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/dist ./dist

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
