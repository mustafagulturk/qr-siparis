FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production TZ=Europe/Istanbul
COPY --from=build /app ./
EXPOSE 3000
# Açılışta veritabanını günceller, sonra uygulamayı başlatır
CMD ["sh", "-c", "npm run db:migrate && npm start"]
