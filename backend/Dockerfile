FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/_core ./_core
COPY --from=build /app/shared ./shared
COPY --from=build /app/db.js ./db.js
COPY --from=build /app/models.js ./models.js
COPY --from=build /app/ghl.js ./ghl.js
COPY --from=build /app/rest.js ./rest.js
RUN mkdir -p /app/uploads
EXPOSE 3001
CMD ["node", "dist/index.js"]
