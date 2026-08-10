FROM node:24-alpine as build-stage
WORKDIR /app
COPY package.json pnpm-lock.yaml .npmrc ./
RUN npm install -g pnpm@9.15.1
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build:prod

# production stage
FROM nginx:stable-alpine
COPY --from=build-stage /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
