# Build Stage
FROM node:20 as build
WORKDIR /app
RUN npm install -g pnpm@latest
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install
COPY . .
# En producción, el proxy de nginx redigirá /api al backend
ENV VITE_API_BASE=/api
RUN pnpm run build

# Serve Stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
