# Offline-friendly image for Liara — no npm install during build.
# Base image from Iranian mirror (Docker Hub blocked on Liara Iran builders).
FROM docker.arvancloud.ir/library/node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/app/data

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
