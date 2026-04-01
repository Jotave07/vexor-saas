FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY server ./server
COPY scripts ./scripts
COPY database ./database
COPY docker-entrypoint.sh ./docker-entrypoint.sh
COPY --from=build /app/dist ./dist

RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3001

CMD ["./docker-entrypoint.sh"]
