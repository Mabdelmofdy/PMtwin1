# syntax=docker/dockerfile:1
FROM node:22-alpine
WORKDIR /app
COPY packages/commands /app/packages/commands
COPY server/package.json /app/server/package.json
WORKDIR /app/server
RUN npm install
COPY server/ /app/server/
COPY POC/data /app/POC/data
ENV SEED_DATA_DIR=/app/POC/data
RUN npx prisma generate && npm run build
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && if [ \"$SEED_ON_BOOT\" = \"true\" ]; then node dist/scripts/import-seed.js; fi && node dist/main.js"]
